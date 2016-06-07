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
        global.ChangesTracker = result ? result : mod.exports;
    }
})(this, function (exports) {

'use strict';

var NG_REMOVED = '$$MY_NG_REMOVED';

function isArray(obj) {
    if (Array.isArray) {
        return Array.isArray(obj);
    }
    return Object.prototype.toString.call(obj) === '[object Array]';
}
function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
}
function isFunction(obj) {
    return Object.prototype.toString.call(obj) === '[object ' + name + ']';
}

function extend(obj, prop, isDeep) {
    var src, copyIsArray, copy, name, clone,
        target = obj || {},
        i = 1,
        length = arguments.length,
        deep = isDeep,
        options = prop;

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !isFunction(target) ) {
        target = {};
    }

    for ( name in options ) {
        if (prop.hasOwnProperty(name)) {
            src = target[ name ];
            copy = options[ name ];

            // Prevent never-ending loop
            if ( target === copy ) {
                continue;
            }

            // Recurse if we're merging plain objects or arrays
            if ( deep && copy && (copyIsArray = isArray(copy)) ) {
                if ( copyIsArray ) {
                    copyIsArray = false;
                    clone = src && isArray(src) ? src : [];

                } else {
                    clone = src ? src : {};
                }

                // Never move original objects, clone them
                target[ name ] = extend( clone, copy, deep );

                // Don't bring in undefined values
            } else if ( copy !== undefined ) {
                target[ name ] = copy;
            }
        }
    }

    return target;
}

function createElement(str) {
    if (isObject(str)) {
        return str;
    }
    var frag = document.createDocumentFragment();

    var elem = document.createElement('div');
    elem.innerHTML = str;

    while (elem.childNodes[0]) {
        frag.appendChild(elem.childNodes[0]);
    }
    return frag.childNodes[0];
}

function domInsert(element, parentElement, afterElement) {
    // if for some reason the previous element was removed
    // from the dom sometime before this code runs then let's
    // just stick to using the parent element as the anchor

    var parent = parentElement || afterElement.parentNode;

    if (afterElement) {
        if (afterElement && !afterElement.parentNode && !afterElement.previousElementSibling) {
            afterElement = null;
        }
    }

    element = createElement(element);

    if (afterElement) {
        afterElement.parentNode.insertBefore(element, afterElement.nextSibling);

        //after(afterElement, element);
    }
    else {

        parent.insertBefore(element, parent.firstChild);

        //prepend(parent, element);
    }

    //afterElement ? afterElement.after(element) : parentElement.prepend(element);
}

var ChangesTracker = (function() {
    function ChangesTracker(element, opts) {
        this.opts = extend({}, this.defOpts);
        this.opts = extend(this.opts, opts);

        this.$element = element;

        this.$startComment = null;

        this.lastBlockMap = null;

        this.init();
    }

    ChangesTracker.prototype.defOpts = {
        debug: true,
        trackById: 'id',
        trackByIdFn: function(key, value, index, trackById) {
            return value[trackById] + '_' + value['id'];
        },
        beforeAdd: function(data, callback) {
            callback = callback || function() {};

            var elem = createElement('<li>'+ data.id +'</li>');

            callback(elem);
        },
        afterAdd: function(data, element){},
        beforeRemove: function(data, element, callback) {
            callback = callback || function () {};

            callback();
        },
        afterRemove: function(data) {}
    };

    ChangesTracker.prototype.init = function() {
        // clear
        while (this.$element.firstChild) {
            this.$element.removeChild(this.$element.firstChild);
        }

        // insert first anchor
        this.$startComment = window.document.createComment('');
        this.$element.appendChild(this.$startComment);

        this.lastBlockMap = Object.create(null);
    };

    ChangesTracker.prototype.updateList = function(collection) {
        var previousNode =  this.$startComment,
            nextNode,
            nextBlockMap = Object.create(null),
            nextBlockOrder,
            collectionLength,
            index, key, value,
            trackById,
            block,
            removed = [];

        collectionLength = collection.length;
        nextBlockOrder = new Array(collectionLength);

        // locate existing items
        for (index = 0; index < collectionLength; index++) {
            key = index;
            value = collection[key];
            trackById = this.opts.trackByIdFn(key, value, index, this.opts.trackById);
            if (this.lastBlockMap[trackById]) {
                // found previously seen block
                block = this.lastBlockMap[trackById];
                delete this.lastBlockMap[trackById];
                nextBlockMap[trackById] = block;
                nextBlockOrder[index] = block;
            } else if (nextBlockMap[trackById]) {
                // if collision detected. restore lastBlockMap and throw an error
                nextBlockOrder.forEach(function(block) {
                    if (block && block.data) {
                        this.lastBlockMap[block.id] = block;
                    }
                }.bind(this));
                throw new Error('Duplicates in a repeater are not allowed');
            } else {
                // new never before seen block
                nextBlockOrder[index] = {id: trackById, data: undefined, element: undefined};
                nextBlockMap[trackById] = true;
            }
        }

        // remove leftover items
        for (var blockKey in this.lastBlockMap) {
            block = this.lastBlockMap[blockKey];

            //$animate.leave(elementsToRemove);
            removed.push(block);

            if (block.element.parentNode) {
                // if the element was not removed yet because of pending animation, mark it as deleted
                // so that we can ignore it later
                block.element[NG_REMOVED] = true;
            }
        }

        // moving/inserting
        for (index = 0; index < collectionLength; index++) {
            key = index;
            value = collection[key];
            block = nextBlockOrder[index];

            if (block.data) {
                // if we have already seen this object
                nextNode = previousNode;

                // skip nodes that are already pending removal via leave animation
                do {
                    nextNode = nextNode.nextSibling;
                } while (nextNode && nextNode[NG_REMOVED]);

                if (block.element != nextNode) {
                    // existing item which got moved

                    // $animate.move(getBlockNodes(block.clone), null, previousNode);
                    domInsert(block.element, null, previousNode);
                }
                previousNode = block.element;
            } else {
                // new item which we don't know about
                block.data = value;

                this.opts.beforeAdd(block.data, function(elem) {
                    // $animate.enter(clone, null, previousNode);
                    domInsert(elem, null, previousNode);

                    this.opts.afterAdd(block.data, elem);

                    previousNode = elem;

                    block.element = elem;
                    nextBlockMap[block.id] = block;
                }.bind(this));
            }
        }
        this.lastBlockMap = nextBlockMap;

        // real removing
        for (var i = 0, l = removed.length; i < l; i++) {
            var block = removed[i];
            this.opts.beforeRemove(block.data, block.element, function(){
                this.$element.removeChild(block.element);
                this.opts.afterRemove(block.data);
                block = block.data = block.element = null;
            }.bind(this));
        }
        removed = null;
    };

    return ChangesTracker;
})();

// Export
exports.ChangesTracker = ChangesTracker;

return ChangesTracker;

});
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
            active = this._normalizeIndex(_active, this._count);
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
        global.swipeDecorator = result ? result : mod.exports;
    }
})(this, function (exports) {

'use strict';

// Import
var utils = window.utils;

//function debugStr(str, replace){
//    var elem = document.getElementById('console');
//    if (replace) {
//        elem.innerHTML = '';
//    }
//    utils.appendElement(elem, str + '<br />');
//}

var SwipeDecorator = function(base, options) {
    function SwipeDecorator() {
        base.apply(this, arguments);

        // swipe options
        this.swipe = {};
        this.swipe._isActive = false;
        this.swipe._lastPos = {};
        this.swipe._preventMove = null;
        this.swipe._timer = null;
        this.swipe._timeStamp = 0;
        this.swipe._velocity = 0;
        this.swipe._amplitude = 0;
        this.swipe._offsetLeft = 0;
        this.swipe._offsetLeftTrack = 0;
        this.swipe._offsetLeftTarget = 0;
        this.swipe._weight = 0.99;

        this.swipe._targetCount = 0;
        this.swipe._dir = 1;
    };
    utils.inherits(SwipeDecorator, base);

    SwipeDecorator.prototype.defOpts = utils.extend({
        supportMouse: true,
        supportTouch: true
    }, base.prototype.defOpts);

    SwipeDecorator.prototype._attachHandlers = function() {
        base.prototype._attachHandlers.apply(this, arguments);

        if (this.opts.supportTouch) {
            // Touch
            this.$list.addEventListener('touchstart', this, false);
            this.$list.addEventListener('touchmove', this, false);
            this.$list.addEventListener('touchend', this, false);
            this.$list.addEventListener('touchcancel', this, false);
        }

        if (this.opts.supportMouse) {
            // Mouse
            this.$list.addEventListener('mousedown', this, false);
            this.$list.addEventListener('mousemove', this, false);
            this.$list.addEventListener('mouseup', this, false);
            this.$list.addEventListener('mouseleave', this, false);
        }
    };

    SwipeDecorator.prototype._detachHandlers = function() {
        base.prototype._detachHandlers.apply(this, arguments);

        if (isMobile) {
            // Touch
            this.$list.removeEventListener('touchstart', this, false);
            this.$list.removeEventListener('touchmove', this, false);
            this.$list.removeEventListener('touchend', this, false);
            this.$list.removeEventListener('touchcancel', this, false);
        }
        else {
            // Mouse
            this.$list.removeEventListener('mousedown', this, false);
            this.$list.removeEventListener('mousemove', this, false);
            this.$list.removeEventListener('mouseup', this, false);
        }
    };

    SwipeDecorator.prototype.handleEvent = function() {
        base.prototype.handleEvent.apply(this, arguments);

        var event = arguments[0];

        switch(event.type) {
            case 'touchstart':
            case 'mousedown': {
                this._touchStart(event);
                break;
            }
            case 'touchmove':
            case 'mousemove': {
                this._touchMove(event);
                break;
            }
            case 'touchend':
            case 'touchcancel':
            case 'mouseup':
            case 'mouseleave': {
                this._touchEnd(event);
                break;
            }
            default : {

                break;
            }
        }
    };

    SwipeDecorator.prototype._touchStart = function(event){
        if (this._isBusy) {
            return;
        }

        this.swipe._isActive = true;
        this.swipe._lastPos = this._getEventPosition(event);
        this.swipe._amplitude = this.swipe._offsetLeft = 0;
        this.swipe._velocity = 0;
        this.swipe._offsetLeftTrack = this.swipe._offsetLeft = this._offsetLeft;
        this.swipe._timeStamp = Date.now();
        window.clearInterval(this.swipe._timer);
        this.swipe._timer = window.setInterval(this._track.bind(this), 100);
    };
    SwipeDecorator.prototype._touchMove = function(event){
        if (!this.swipe._isActive) {
            return;
        }

        var coords = this._getEventPosition(event);

        if (this.swipe._preventMove === null) {
            var swipeDir = this._getSwipeDirection(this.swipe._lastPos, coords);
            if (swipeDir === null) {
                return;
            }
            else if (swipeDir == 'up' || swipeDir == 'down') {
                this.swipe._isActive = false;
                return;
            }
            else {
                this.swipe._preventMove = true;
            }
        }
        event.preventDefault();
        event.stopPropagation();

        var deltaX = coords.x - this.swipe._lastPos.x;

        var offsetLeft = this._offsetLeft + deltaX;
        this._setOffset(offsetLeft);
        this.swipe._offsetLeft = offsetLeft;
    };
    SwipeDecorator.prototype._touchEnd = function(event) {
        if (!this.swipe._isActive) {
            return;
        }

        this.swipe._isActive = false;
        this.swipe._preventMove = null;
        window.clearInterval(this.swipe._timer);

        this.swipe._offsetLeftTarget = this.swipe._offsetLeft;
        this.swipe._targetCount = 0;

        var coords = this._getEventPosition(event);

        this.swipe._dir = 1;
        if (coords.x > this.swipe._lastPos.x) {
            this.swipe._dir = -1;
        }

        var maxCount = this._getMaxSlideCount(this.swipe._dir);

        if (this.swipe._velocity > 100 || this.swipe._velocity < -100) {

            this.swipe._amplitude = this.swipe._weight * this.swipe._velocity;

            var count = Math.abs((this.swipe._offsetLeftTarget + this.swipe._dir * this.swipe._amplitude)/this._itemWidth);

            this.swipe._offsetLeftTarget = this._offsetLeft + this.swipe._amplitude;
        }

        this.swipe._targetCount = (this.swipe._offsetLeftTarget - this._offsetLeft) / this._itemWidth;

        this.swipe._targetCount = Math.round(Math.abs(this.swipe._targetCount));

        if (this.swipe._targetCount > maxCount) {
            this.swipe._targetCount = maxCount;
        }

        this.swipe._offsetLeftTarget = this._getOffsetLeft(this.swipe._dir * this.swipe._targetCount, true);

        this.swipe._amplitude = (this.swipe._offsetLeftTarget - this.swipe._offsetLeft);

        this.swipe._timeStamp = Date.now();
        requestAnimationFrame(this._animate.bind(this));
    };

    SwipeDecorator.prototype._track = function(event) {
        var now, elapsed, delta, v;

        now = Date.now();
        elapsed = now - this.swipe._timeStamp;
        this.swipe._timeStamp = now;
        delta = this.swipe._offsetLeft - this.swipe._offsetLeftTrack;
        this.swipe._offsetLeftTrack = this.swipe._offsetLeft;

        v = 1000 * delta / (1 + elapsed);
        this.swipe._velocity = 0.8 * v + 0.2 * this.swipe._velocity;
    };
    SwipeDecorator.prototype._animate = function() {
        var now, elapsed, delta;

        if (this.swipe._amplitude) {
            now = Date.now();
            elapsed = now - this.swipe._timeStamp;
            delta = - this.swipe._amplitude * Math.exp(- elapsed / 325);
            if (delta > 8 || delta < -8) {
                this._setOffset(this.swipe._offsetLeftTarget + delta);
                requestAnimationFrame(this._animate.bind(this));
                this._isBusy = true;
            }
            else {
                this._isBusy = false;
                this.slideTo(this.swipe._dir, this.swipe._targetCount, true);
            }
        }
    };

    SwipeDecorator.prototype._getEventPosition = function(event) {
        var originalEvent = event.originalEvent || event;
        var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
        var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

        return {
            x: e.clientX,
            y: e.clientY
        };
    };
    SwipeDecorator.prototype._getSwipeDirection = function(startPoint, endPoint) {
        var x = startPoint.x - endPoint.x;
        var y = startPoint.y - endPoint.y;

        var xAbs = Math.abs(x),
            yAbs = Math.abs(y);

        if (xAbs < 25 && yAbs < 25){
            return null;
        }

        if (xAbs > yAbs) {
            if (x > 0) {
                return 'left';
            }
            return 'right'
        }
        else {
            if (y > 0) {
                return 'up';
            }
            return 'down';
        }
    };

    return SwipeDecorator;
};

function swipeDecorator(options) {
    return function(target) {
        return SwipeDecorator(target, options);
    }
}

// Export
exports.swipeDecorator = swipeDecorator;
exports.SwipeDecorator = SwipeDecorator;

return swipeDecorator;

});


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
        global.keyHandlerDecorator = result ? result : mod.exports;
    }
})(this, function (exports) {

'use strict';

// Import
var utils = window.utils;

var KeyHandlerDecorator = function(base, options) {
    function KeyHandlerDecorator() {
        base.apply(this, arguments);
    };
    utils.inherits(KeyHandlerDecorator, base);

    KeyHandlerDecorator.prototype._attachHandlers = function() {
        base.prototype._attachHandlers.apply(this, arguments);

        document.addEventListener('keyup', this._keyHandler.bind(this), false);
    };

    KeyHandlerDecorator.prototype._detachHandlers = function() {
        base.prototype._detachHandlers.apply(this, arguments);

        document.removeEventListener('keyup', this._keyHandler.bind(this), false);
    };

    KeyHandlerDecorator.prototype._keyHandler = function(event) {
        // > 39
        // < 37

        var keyCode = event.which || event.keyCode;

        if (keyCode == 39 || keyCode == 37) {
            var dir = 1;
            if (keyCode == 37) {
                dir = -1;
            }
            this.slideTo(dir);
        }
    };

    return KeyHandlerDecorator;
};

function keyHandlerDecorator(options) {
    return function(target) {
        return KeyHandlerDecorator(target, options);
    }
}

// Export
exports.keyHandlerDecorator = keyHandlerDecorator;
exports.KeyHandlerDecorator = KeyHandlerDecorator;

return keyHandlerDecorator;

});


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
        global.myLazyCarouselModule = result ? result : mod.exports;
    }
})(this, function (exports) {

    'use strict';

// Import
    var angular = window.angular;
    var utils = window.utils;
    var LazyCarousel = window.LazyCarousel;

    var myLazyCarouselModule = angular.module('myLazyCarousel', []);

// Controller
    var MyLazyCarouselCtrl = (function() {
        var $timeout;

        function MyLazyCarouselCtrl($scope, _$timeout_) {
            $timeout = _$timeout_;
            this.$scope = $scope;
            this._itemScopeAs = 'item';

            LazyCarousel.call(this, null, {
                noInit: true,
                trackById: '_id'
            });
        }
        MyLazyCarouselCtrl.$inject = ['$scope', '$timeout'];
        utils.inherits(MyLazyCarouselCtrl, LazyCarousel);

        MyLazyCarouselCtrl.prototype.init = function(elem, _transclude){
            this._transclude = _transclude;

            LazyCarousel.prototype.init.call(this, elem);
        };

        MyLazyCarouselCtrl.prototype._transclude = function($scope, callback){
            callback = callback || function(){};
            callback(false);
        };
        MyLazyCarouselCtrl.prototype._addItemPost = function(item, $item) {
            // compile

            var itemAs = this.$scope.itemAs || this._itemScopeAs;

            var childScope = this.$scope.$parent.$new();

            var self = this;
            this._transclude(childScope, function(elem, $scope){
                $scope[itemAs] = item;

                $scope.$carousel = self.$scope;
                $scope.$isActive = false;
                $scope.$isShowed = false;

                $scope.$watch('$carousel.active._id', function (newActiveId) {
                    $scope.$isActive = (newActiveId == item._id) ? true : false;
                });

                angular.element($item).append(elem);

                $timeout(function(){
                    $scope.$digest();
                });

                $timeout(function(){
                    $scope.$isShowed = true;
                }, 500);
            });
        };
        MyLazyCarouselCtrl.prototype._removeItemPre = function(item, $item, callback) {
            // destroy
            var $scope = angular.element($item).children().scope();
            $scope.$destroy();

            callback();
        };
        MyLazyCarouselCtrl.prototype._getItemTemplate = function(item) {
            return '<li class="lc-item" data-id="'+ item._id +'"></li>';
        };

        return MyLazyCarouselCtrl;
    })();

// Directive
    function MyLazyCarouselDirective($timeout) {
        var iid = 1;

        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                items: '=myLazyCarousel',
                itemAs: '@itemAs',
                activeIndex: '=myLazyCarouselActive'
            },
            template:   '<div class="lc-list_holder">' +
            '   <ul class="lc-list"></ul>' +
            '</div>' +
            '<div class="lc-nav">' +
            '   <a href="#" ng-click="goTo($event, -1)" class="lc-nav_link prev" data-dir="-1">Prev</a>' +
            '   <a href="#" ng-click="goTo($event, 1)" class="lc-nav_link next" data-dir="1">Next</a>' +
            '</div>',
            controller: 'myLazyCarouselCtrl',
            compile: function(tElement, tAttrs) {

                return function ($scope, element, attrs, ctrl, transclude) {
                    $scope._iid = iid++;

                    ctrl.init(element[0], transclude);

                    $scope.active = null;
                    $scope.nav = {
                        prev: false,
                        next: false
                    };

                    var innerActiveIndex = $scope.activeIndex;

                    $scope.goTo = function ($event, dir) {
                        $event.preventDefault();
                        ctrl.slideTo(parseInt(dir, 10));
                    };

                    $scope.setActive = function($event, item) {
                        if ($event) {
                            $event.preventDefault();
                        }
                        ctrl.slideToId(item._id);
                    };

                    $scope.$watch('items', function (newList) {
                        ctrl.updateItems(newList || [], innerActiveIndex);
                    });

                    //$scope.$watch('activeIndex', function (newActiveIndex) {
                    //    innerActiveIndex = $scope.activeIndex;
                    //});

                    $scope.$on('$destroy', ctrl.destroy.bind(ctrl));

                    ctrl.$events.on('activeChange', function (data) {
                        var item = data.item;
                        if ($scope.active && item && $scope.active._id == item._id) {
                            return;
                        }

                        innerActiveIndex = data.activeIndex;

                        $timeout(function () {
                            $scope.active = item;
                        });
                    });

                    ctrl.$events.on('navChange', function (nav) {
                        $timeout(function () {
                            $scope.nav.prev = nav.prev;
                            $scope.nav.next = nav.next;
                        });
                    });
                };

            }
        };
    }
    MyLazyCarouselDirective.$inject = ['$timeout'];


    myLazyCarouselModule.directive('myLazyCarousel', MyLazyCarouselDirective);
    myLazyCarouselModule.controller('myLazyCarouselCtrl', MyLazyCarouselCtrl);

// Export
    exports.myLazyCarouselModule = myLazyCarouselModule;

    return myLazyCarouselModule;

});