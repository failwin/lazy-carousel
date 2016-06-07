(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        var mod = {
            exports: {}
        };
        var result = factory(mod.exports);
        global.LazyCarousel = result ? result : mod.exports;
    }
})(this, function (exports) {

'use strict';

// Import
var Promise = window.ES6Promise.Promise;
var EventEmitter = window.events.EventEmitter;
var utils = window.utils;
var ChangesTracker = window.ChangesTracker;

var debug = false;
var logLevel = ['calls', 'calls res']; // 'calls', 'calls res'
var log = function() {
    var args = [].slice.call(arguments, 0);
    if (logLevel.indexOf(args.shift()) > -1) {
        console.log(args);
    }
};

var LazyCarousel = (function() {
    function LazyCarousel(elem, opts) {
        this.opts = utils.extend({}, this.defOpts);
        this.opts = utils.extend(this.opts, opts);

        this.$holder = elem ? elem : null;
        this.$wrapper = null;
        this.$list = null;

        this.items = [];
        this._partialItems = [];

        this._holderWidth = 0;
        this._itemWidth = 0;

        this._offsetLeft = 0;

        this._active = null;
        this._visible = 0;
        this._addition = 0;
        this._count = 0;

        this._transformProperty = '';
        this._translateZ = '';

        this.changesTracker = null;

        this._nav = {
            prev: false,
            next: false
        };
        this._isSimple = false;

        this._isBusy = false;

        this.$events = new EventEmitter();

        if (!this.opts.noInit) {
            this.init();
        }
    }

    LazyCarousel.prototype.defOpts = {
        noInit: false,
        itemWidth: 50,
        debug: false
    };

    LazyCarousel.prototype.init = function(elem) {
        var self = this;

        this.$events.on('error', function(e){
            console.error(e);
            console.log(e.message);
        });

        this.$holder = elem ? elem : this.$holder;
        if (!this.$holder) {
            this.$events.emit('error', new Error('LazyCarousel.$holder not found.'));
            return;
        }

        this.$list = this.$holder.querySelector('ul');

        if (!this.$list) {
            this.$events.emit('error', new Error('LazyCarousel.$list not found.'));
            return;
        }

        this.$wrapper = this.$list.parentNode;

        this._transformProperty = utils.getPrefixedStyleValue('transform');
        this._translateZ = utils.supportsPerspective() ? 'translateZ(0)' : '';

        this.changesTracker = new ChangesTracker(this.$list, {
            trackById: '_id',
            beforeAdd: this._addItemPre.bind(this),
            afterAdd: this._addItemPost.bind(this),
            beforeRemove: this._removeItemPre.bind(this),
            afterRemove: this._removeItemPost.bind(this)
        });

        this._attachHandlers();

        this.resize();
    };
    LazyCarousel.prototype.destroy = function() {
        this._detachHandlers();
    };

    LazyCarousel.prototype.resize = function(force, _itemWidth, _holderWidth) {
        if (debug) {
            log('calls', 'LazyCarousel.resize', force, _itemWidth, _holderWidth);
        }

        var self = this;

        this._holderWidth = _holderWidth || this.$wrapper.clientWidth;

        if (typeof _itemWidth != 'undefined') {
            this._itemWidth = _itemWidth;
        }
        else if (this.$list.firstChild && this.$list.firstChild.tagName === 'LI') {
            this._itemWidth = this.$list.firstChild.clientWidth;
        }
        else {
            var item = utils.prependElement(this.$list, '<li class="item"></li>');
            this._itemWidth = item.clientWidth;
            this.$list.removeChild(item);
        }

        if (this._itemWidth < 10) {
            this._itemWidth = this.opts.itemWidth;
            this.$events.emit('error', new Error('LazyCarousel._itemWidth == 0'));
        }

        if (debug) {
            log('calls res', 'LazyCarousel.resize result', this._holderWidth, this._itemWidth);
        }

        if (!this.items.length) {
            return;
        }

        this._calculateVisibility();

        this._updateNav();

        this._centerList();
    };

    LazyCarousel.prototype._calculateVisibility = function(noUpdate){
        if (debug) {
            log('calls', 'LazyCarousel._calculateVisibility', noUpdate);
        }

        var innerUpdate = false;

        var visible = this._itemWidth ? Math.floor(this._holderWidth/this._itemWidth) + 1 : 0;
        if (visible % 2 === 0) {    // 0 2 4 6
            visible++;              // 1 3 5 7
        }

        if (this._count && visible >= this._count + 1) {
            visible = this._count;
            if (visible != this._visible) {
                innerUpdate = true;
            }
        }

        if (this._count && visible >= this._count) {
            if (visible != this._visible) {
                innerUpdate = true;
            }
            this._isSimple = true;
        }
        else {
            this._isSimple = false;
        }

        this._addition = visible;
        if (this._addition <= 0) {
            this._addition = 1;
        }

        if (this._isSimple) {
            this._addition = 0;
        }

        if (debug) {
            log('calls res', 'LazyCarousel._calculateVisibility', innerUpdate, visible, this._addition, this._isSimple);
        }

        if (noUpdate) {
            this._visible = visible;
        }
        else if (visible != this._visible || innerUpdate) {
            this._visible = visible;
            this._updateVisible();
        }
    };

    LazyCarousel.prototype.updateItems = function(list, _active) {
        if (debug) {
            log('calls', 'LazyCarousel.updateItems', list);
        }

        var self = this;

        this.items = list;
        this._count = this.items.length;

        this._calculateVisibility(true);

        this._updateVisible(true);

        var active = this._count ? 0 : null;

        if (typeof _active !== 'undefined') {
            active = _active;
            if (active > this._count) {
                active = this._count - 1;
            }
        }

        this._updateActive(active, true, 0);

        this._centerList();
    };

    LazyCarousel.prototype._updateVisible = function(replace) {
        if (debug) {
            log('calls', 'LazyCarousel._updateVisible', replace);
        }

        var active = this._active,
            visible = this._visible;

        this._partialItems = this._getPartialItems();

        this.changesTracker.updateList(this._partialItems);

        this._updateNav();
    };

    LazyCarousel.prototype.slideTo = function(dir, _count, _fast) {
        if (debug) {
            log('calls', 'LazyCarousel.slideTo', dir, _count, _fast);
        }

        return new Promise(function(resolve, reject) {
            var newActive, left;

            if (this._isBusy) {
                return resolve();
            }
            this._isBusy = true;

            var count = 0;
            if (typeof _count == 'undefined') {
                count = 1;
            }
            else {
                count = _count;
            }

            var maxCount = this._getMaxSlideCount(dir);

            if (count > maxCount) {
                count = maxCount;
            }

            dir = dir * count;
            left = this._getOffsetLeft(dir, true);

            // active update
            newActive = this._active + dir;

            if (utils.supportsTransitions()) {
                this._updateActive(newActive, true, dir > 0 ? 1 : -1);
            }

            // the same index
            if (Math.abs(this._offsetLeft - left) < 20) {
                this._isBusy = false;
                return resolve();
            }

            // animate
            var time = _fast ? 0 : 300;
            var animationPromise = this._animateOffset(left, time)
                .then(function() {
                    this._isBusy = false;

                    if (!utils.supportsTransitions()) {
                        this._updateActive(newActive, true, dir > 0 ? 1 : -1);
                    }

                    this._updateVisible();

                    this._centerList();

                    return true;
                }.bind(this));

            resolve(animationPromise);

        }.bind(this));
    };
    LazyCarousel.prototype.slideToId = function(id) {
        if (debug) {
            log('calls', 'LazyCarousel.slideToId', id);
        }

        return new Promise(function(resolve, reject) {
            var activeIndex = this._active,
                newIndex = this._getItemIndexById(id, this._partialItems, '_id');

            if (!this._isSimple) {
                activeIndex = Math.floor(this._visible/2) + this._addition;
            }

            var dir = newIndex - activeIndex;

            var count = Math.abs(dir);

            dir = dir > 0 ? 1 : -1;

            if (newIndex >= 0 && count > 0) {
                var slideToPromise = this.slideTo(dir, count);

                return resolve(slideToPromise);
            }
            resolve();

        }.bind(this));
    };

    LazyCarousel.prototype._setOffset = function(offsetLeft) {
        if (debug) {
            log('calls', 'LazyCarousel._setOffset', offsetLeft);
        }

        var $elem = this.$list;

        $elem.style[this._transformProperty] = 'translateX('+ offsetLeft +'px) ' + this._translateZ;
    };
    LazyCarousel.prototype._animateOffset = function(offsetLeft, duration) {
        if (debug) {
            log('calls', 'LazyCarousel._animateOffset', offsetLeft, duration);
        }

        var $elem = this.$list;

        return new Promise(function(resolve, reject) {
            if (!duration) {
                this._setOffset(offsetLeft);
                resolve();
            }
            else {
                if (utils.supportsTransitions()) {
                    // css3 transition
                    utils.animateCss(this.$list,
                        {
                            'transform' : 'translateX('+ offsetLeft +'px) ' + this._translateZ
                        },
                        {
                            duration : duration,
                            onComplete : resolve
                        }
                    );
                }
                else {
                    move($elem, offsetLeft, duration, resolve, this);
                }
            }
        }.bind(this));

        function move($elem, to, duration, complete, self) {
            var transformProperty = self._transformProperty,
                translateZ = self._translateZ,
                from = self._offsetLeft,
                delta = to - from;

            animate({
                duration: duration,
                step: function(progress) {
                    var curOffsetLeft = from + delta * progress;
                    $elem.style[transformProperty] = 'translateX('+ curOffsetLeft +'px) ' + translateZ;
                },
                complete: complete
            });
        }

        function animate(opts) {
            var start = Date.now();

            opts.easing = opts.easing || function(p) {
                return p;
            };

            opts.duration = opts.duration || 300;

            opts.complete = opts.complete || function(){};

            var id = setInterval(function() {
                var timePassed = Date.now() - start;
                var progress = timePassed / opts.duration;

                if (progress > 1) {
                    progress = 1;
                }

                var delta = opts.easing(progress);
                opts.step(delta);

                if (progress == 1) {
                    clearInterval(id);
                    opts.complete();
                }
            }, opts.delay || 10);
        }
    };

    LazyCarousel.prototype._centerList = function() {
        if (debug) {
            log('calls', 'LazyCarousel._centerList');
        }

        var active = this._active,
            visible = this._visible,
            addition = this._addition;

        var offsetLeft = this._getOffsetLeft(false, false, this._isSimple);

        this._setOffset(offsetLeft);

        this._offsetLeft = offsetLeft;
    };
    LazyCarousel.prototype._getOffsetLeft = function(_index, _isDir, _isSimple) {
        if (debug) {
            log('calls', 'LazyCarousel._getOffsetLeft', _index, _isDir, _isSimple);
        }

        var index = this._active || _index,
            visible = this._visible,
            addition = this._addition,
            offsetLeft = 0;

        if (!index && index !== 0) {
            index = 0;
        }
        else {
            index = this._normalizeIndex(index);
        }

        if (_isSimple) {
            offsetLeft = this._holderWidth/2 - this._itemWidth/2;

            offsetLeft = offsetLeft - index * this._itemWidth;
        }
        else {
            if (_isDir) {
                var dir = _index;
                offsetLeft = this._offsetLeft - (dir * this._itemWidth);
            }
            else {
                index = _index || 0; // element at the center

                offsetLeft = this._holderWidth/2 - this._itemWidth/2;

                offsetLeft = offsetLeft - (addition + Math.floor(visible/2) + index) * this._itemWidth;

            }
        }

        if (debug) {
            log('calls res', 'LazyCarousel._getOffsetLeft result', offsetLeft);
        }

        return offsetLeft;
    };
    LazyCarousel.prototype._getMaxSlideCount = function(dir){
        if (debug) {
            log('calls', 'LazyCarousel._getMaxSlideCount', dir);
        }

        var count;

        var active = this._normalizeIndex(this._active);
        if (this._isSimple) {
            if (dir > 0) {
                count = this._count - active - 1;
            }
            else {
                count = Math.abs(active);
            }
        }
        else {
            count = this._addition;
        }

        if (debug) {
            log('calls res', 'LazyCarousel._getMaxSlideCount result', count);
        }

        return count;
    };

    LazyCarousel.prototype._getPartialItems = function(_active, _visible, _addition, _isSimple, _list) {
        if (debug) {
            log('calls', 'LazyCarousel._getPartialItems', _active, _visible, _addition, _isSimple, _list);
        }

        var active = _active || this._active,
            visible = _visible || this._visible,
            addition =_addition || this._addition,
            isSimple = _isSimple || this._isSimple,
            globalList = _list || this.items,
            globalListLength = globalList.length,
            list = [];

        if (!globalListLength) {
            return list;
        }

        var count = visible + 2 * addition,
            startIndex = active - Math.floor(count/2);

        if (isSimple) {
            startIndex = 0;
            count = globalListLength;
        }

        for (var i = startIndex, j = 0; j < count; i++, j++){
            var item = this._getItemByIndex(i, globalList);

            var clearItem = utils.extend({}, item, true);

            clearItem._id = i;

            list.push(clearItem);
        }

        if (debug) {
            log('calls res', 'LazyCarousel._getPartialItems result', list);
        }

        return list;
    };

    LazyCarousel.prototype._addItemPre = function(item, callback) {
        if (debug) {
            log('calls', 'LazyCarousel._addItemPre', item, before, callback);
        }

        callback = callback || function(){};

        var itemStr = this._getItemTemplate(item),
            $item = utils.createElement(itemStr);

        callback($item);
    };
    LazyCarousel.prototype._addItemPost = function(item, $item) {
        if (debug) {
            log('calls', 'LazyCarousel._addItemPost', item, $item);
        }

    };

    LazyCarousel.prototype._removeItemPre = function(item, $item, callback) {
        if (debug) {
            log('calls', 'LazyCarousel._removeItemPre', item, $item, callback);
        }

        callback = callback || function() {};

        callback();
    };
    LazyCarousel.prototype._removeItemPost = function($item) {
        if (debug) {
            log('calls', 'LazyCarousel._removeItemPost', $item);
        }
    };

    LazyCarousel.prototype._updateNav = function(val) {
        if (debug) {
            log('calls', 'LazyCarousel._updateNav', val);
        }

        if (this._isSimple) {
            if (this._normalizeIndex(this._active) <= 0) {
                this._nav.prev = false;
            }
            else {
                this._nav.prev = true;
            }

            if (this._normalizeIndex(this._active) >= this._count - 1) {
                this._nav.next = false;
            }
            else {
                this._nav.next = true;
            }
        }
        else {
            this._nav = {
                prev: true,
                next: true
            };
        }

        if (debug) {
            log('calls res', 'LazyCarousel._updateNav', this._nav);
        }

        this.$events.emit('navChange', this._nav);
    };
    LazyCarousel.prototype._updateActive = function(active, _force, _div) {
        if (debug) {
            log('calls', 'LazyCarousel._updateActive', active, _force);
        }

        if (this._active === active && !_force) {
            return;
        }
        this._active = active;

        var active = this._getPartialItemByIndex(this._active, _div);
        //this._getItemById(this._active, this._partialItems, '_id');

        if (active){
            this.$events.emit('activeChange', {
                item: active,
                activeIndex: this._active
            });
        }
        else {
            this.$events.emit('activeChange', {
                item: null,
                activeIndex: this._active
            });
        }
    };

    LazyCarousel.prototype._getItemById = function(id, _list, _key) {
        if (debug) {
            log('calls', 'LazyCarousel._getItemById', id, _list, _key);
        }

        var list = _list || this.items,
            key = _key || 'id';


        for (var i = 0, c = list.length; i < c; i++){
            if (list[i][key] == id) {
                return list[i];
            }
        }

        return false;
    };
    LazyCarousel.prototype._getItemIndexById = function(id, _list, _key) {
        if (debug) {
            log('calls', 'LazyCarousel._getItemIndexById', id, _list, _key);
        }

        var list = _list || this.items,
            key = _key || 'id';

        for (var i = 0, c = list.length; i < c; i++){
            if (list[i][key] == id) {
                return i;
            }
        }

        return -1;
    };
    LazyCarousel.prototype._getItemByIndex = function(index, _list, loop) {
        if (debug) {
            log('calls', 'LazyCarousel._getItemIndexById', index, _list, loop);
        }

        var list = _list || this.items;

        if (!list.length) {
            return false;
        }

        index = this._normalizeIndex(index, list.length);

        if (list[index]) {
            return list[index];
        }

        return false;
    };

    LazyCarousel.prototype._getPartialItemByIndex = function(globalIndex, dir) {
        var list = this._partialItems,
            loop = true;

        if (!list.length) {
            return false;
        }

        var index = globalIndex;

        if (!this._isSimple) {
            index = this._addition + Math.floor(this._visible/2) + index - this._active + dir;
        }

        if (loop) {
            var count = list.length,
                i = 0;

            while (index < 0) {
                i++;
                index = count + index;

                if (i > 100) {
                    this.$events.emit('error', new Error('GCarousel._getItemByIndex() too much recursion.'));
                    return;
                }
            }

            while (index >= count) {
                i++;
                index = index - count;

                if (i > 100) {
                    this.$events.emit('error', new Error('GCarousel._getItemByIndex() too much recursion.'));
                    return;
                }
            }
        }

        if (list[index]) {
            return list[index];
        }

        return false;
    };

    LazyCarousel.prototype._getItemTemplate = function(item) {
        if (debug) {
            log('calls', 'LazyCarousel._getItemTemplate', item);
        }

        return '<li class="item" data-id="'+ item._id +'"></li>';
    };

    LazyCarousel.prototype._attachHandlers = function() {
        if (debug) {
            log('calls', 'LazyCarousel._attachHandlers');
        }

        window.addEventListener('resize', this, false);
    };
    LazyCarousel.prototype._detachHandlers = function() {
        if (debug) {
            log('calls', 'LazyCarousel._detachHandlers');
        }

        window.removeEventListener('resize', this, false);
    };

    LazyCarousel.prototype.handleEvent = function(event) {
        switch(event.type) {
            case 'resize':
            case 'orientationchange':
            case 'msOrientationChange':
            case 'mozOrientationChange':
            case 'webkitOrientationChange': {
                this._resizeHandler(event);
                break;
            }
            default : {

                break;
            }
        }
    };

    LazyCarousel.prototype._resizeHandler = function(event) {
        this.resize();
    };

    LazyCarousel.prototype._normalizeIndex = function(_active, _count) {
        var active = this._active,
            count = this._count;

        var newActive = 0;

        if (typeof _active != 'undefined') {
            active = _active;
        }

        if (typeof _count != 'undefined') {
            count = _count;
        }

        var dir = active < 0 ? -1 : 1;
        var parts = Math.floor(Math.abs(active/count));

        if (dir < 0) {
            parts++;
            newActive = active - (count * parts * dir);

            return this._normalizeIndex(newActive, count);
        }
        else {
            newActive = active - (count * parts * dir);
        }

        return newActive;
    };

    // Static functions
    LazyCarousel.create = function(elem, opts) {
        return new LazyCarousel(elem, opts);
    };

    return LazyCarousel;
})();

// Export
exports.LazyCarousel = LazyCarousel;

return LazyCarousel;

});