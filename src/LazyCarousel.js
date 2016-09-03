(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define("LazyCarousel", ['es6-promise', 'events', 'my-utils', 'ChangesTracker'], factory);
    } else if (typeof exports !== 'undefined') {
        // CommonJS
        module.exports = factory(
            require('es6-promise'),
            require('events'),
            require('my-utils'),
            require('./ChangesTracker.js')
        );
    } else {
        // Browser globals
        global.LazyCarousel = factory(
            global.ES6Promise,
            global.events,
            global.utils,
            global.ChangesTracker
        );
    }
})(this, function (ES6Promise, events, utils, ChangesTracker) {

'use strict';

// Import
var Promise = ES6Promise.Promise;
var EventEmitter = events.EventEmitter;

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

        this.$events = null;

        this.$holder = elem;
        this.$list = null;
        this.$listHolder = null;

        this.active = 0;

        this.isSimple = null;
        this.visible = 0;
        this.addition = 0;

        this.items = [];

        this.partialItems = [];
        this._partialItemsBefore = [];
        this._partialItemsAfter = [];

        this.holderWidth = null;
        this.itemWidth = null;

        this.changesTracker = null;

        if (!this.opts.noInit) {
            this.init();
        }
    }

    LazyCarousel.prototype.defOpts = {
        noInit: false,
        uniquKeyProp: 'id'
    };

    LazyCarousel.prototype.init = function(_elem) {
        var self = this;

        this.$holder = _elem ? _elem : this.$holder;
        this.$list = this.$holder.querySelector('ul');
        this.$listHolder = this.$list ? this.$list.parentNode : null;

        this.$events = new EventEmitter();

        this.changesTracker = new ChangesTracker(this.$list, {
            trackById: this.opts.uniquKeyProp,
            beforeAdd: this._addItemPre.bind(this),
            afterAdd: this._addItemPost.bind(this),
            beforeRemove: this._removeItemPre.bind(this),
            afterRemove: this._removeItemPost.bind(this)
        });

        this._attachHandlers();

        this.resize();
    };

    LazyCarousel.prototype.resize = function() {
        this._fetchElementsSize();
        this._updateVisible();
    };

    LazyCarousel.prototype.updateItems = function(items, _active) {
        this.items = (items && items.length) ?  items : [];

        this._fetchElementsSize();

        var res = LazyCarousel.utils.calculateVisible(this.holderWidth, this.itemWidth, this.items.length);

        this.isSimple = res.isSimple;
        this.visible = res.visible;
        this.addition = res.addition;

        this.active = _active || 0;

        this._updateVisible();
    };
    LazyCarousel.prototype._updateVisible = function() {
        var partials =  LazyCarousel.utils.getPartialItems(this.items,
                                        this.active,
                                        this.visible,
                                        this.addition,
                                        this.isSimple);

        this.partialItems = partials.list;
        this._partialItemsBefore = partials.before;
        this._partialItemsAfter = partials.after;

        this.changesTracker.updateList(this.partialItems);
    };

    LazyCarousel.prototype.slideToIndex = function() {

    };
    LazyCarousel.prototype.slideToDir = function() {

    };

    LazyCarousel.prototype._addItemPre = function(item, callback) {
        callback = callback || function(){};

        var itemStr = this._getItemTemplate(item),
            $item = utils.createElement(itemStr);

        callback($item);
    };
    LazyCarousel.prototype._addItemPost = function(item, $item) {

    };

    LazyCarousel.prototype._removeItemPre = function(item, $item, callback) {
        callback = callback || function() {};

        callback();
    };
    LazyCarousel.prototype._removeItemPost = function($item) {

    };

    LazyCarousel.prototype._getItemTemplate = function(item) {
        var idKey = this.opts.uniquKeyProp;
        return '<li class="item" data-id="'+ item[idKey] +'">'+ item[idKey] +'</li>';
    };

    LazyCarousel.prototype._fetchElementsSize = function() {
        if (!this.$list || !this.$listHolder) {
            return;
        }

        this.holderWidth = this.$listHolder ? this.$listHolder.clientWidth : null;

        var item = this.$list ? this.$list.querySelector('li') : null;

        if (item) {
            this.itemWidth = item.clientWidth;
        }
        else {
            item = utils.appendElement(this.$list, '<li class="item"></li>');
            this.itemWidth = item.clientWidth;
            this.$list.removeChild(item);
        }
    };

    LazyCarousel.prototype._attachHandlers = function() {
        window.addEventListener('resize', this, false);
        window.addEventListener('orientationchange', this, false);
        window.addEventListener('msOrientationChange', this, false);
        window.addEventListener('mozOrientationChange', this, false);
        window.addEventListener('webkitOrientationChange', this, false);
    };
    LazyCarousel.prototype._detachHandlers = function() {
        window.removeEventListener('resize', this, false);
        window.removeEventListener('orientationchange', this, false);
        window.removeEventListener('msOrientationChange', this, false);
        window.removeEventListener('mozOrientationChange', this, false);
        window.removeEventListener('webkitOrientationChange', this, false);
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

    LazyCarousel.prototype.destroy = function() {
        this._detachHandlers();
    };

    return LazyCarousel;
})();

function calculateVisible(holderWidth, itemWidth, count) {
    var isSimple = true,
        visible = 0,
        addition = 0;

    visible = Math.floor(holderWidth/itemWidth) + 1;
    if (visible % 2 === 0) {    // 0 2 4 6
        visible++;              // 1 3 5 7
    }

    visible = Math.min(count, visible);

    if (3 * visible >= count) {
        isSimple = true;
    }
    else {
        isSimple = false;
        addition = visible;
    }

    return {
        isSimple: isSimple,
        visible: visible,
        addition: addition
    };
}

function getItemInfoById(id, list, _key) {
    var list = list || [],
        key = _key || 'id';

    for (var i = 0, c = list.length; i < c; i++){
        if (list[i][key] == id) {
            return {
                index: i,
                data: list[i]
            };
        }
    }

    return null;
}

function normalizeIndex(index, count) {
    var newActive = index;

    var dir = index < 0 ? -1 : 1;
    var parts = Math.floor(Math.abs(index/count));

    if (dir < 0) {
        parts++;
        newActive = index - (count * parts * dir);

        return normalizeIndex(newActive, count);
    }
    else {
        newActive = index - (count * parts * dir);
    }

    return newActive;
}

function globalToPartialIndex(offset, globalCount, partialCount, _isSimple) {
    if (_isSimple) {

    }
    else {

        return normalizeIndex(index, globalCount);
    }
}
function partialToGlobalIndex(index, globalCount, _isSimple) {

}

function getPartialItems(list, index, visible, addition, isSimple) {
    var res = {
            list: []
        },
        count = visible + 2 * addition,
        globalCount,
        beforeHalf,
        afterHalf,
        afterHalfArr = [],
        beforeHalfArr = [],
        normalIndex;


    if (!list || !list.length) {
        return res;
    }

    globalCount = list.length;
    count = Math.min(count, globalCount);

    if (isSimple) {
        count = globalCount;
    }

    // take before/after count
    beforeHalf = Math.floor(count/2);
    afterHalf = count - beforeHalf;

    if (isSimple) {
        // shift list into right by 1
        if (beforeHalf == afterHalf) {
            beforeHalf--;
            afterHalf++;
        }
    }

    // collect after items
    for(var i = index, k = 0; k < afterHalf; i++, k++) {
        normalIndex = normalizeIndex(i, globalCount);
        afterHalfArr.push(list[normalIndex]);
    }

    // collect before items
    for(var j = index - 1, l = 0; l < beforeHalf; j--, l++) {
        normalIndex = normalizeIndex(j, globalCount);
        beforeHalfArr.push(list[normalIndex]);
    }

    res.list = beforeHalfArr.reverse().concat(afterHalfArr);

    res.after = afterHalfArr;
    res.before = beforeHalfArr;

    return res;
}

// Export
LazyCarousel.utils = {
    calculateVisible: calculateVisible,
    getItemInfoById: getItemInfoById,
    normalizeIndex: normalizeIndex,
    globalToPartialIndex: globalToPartialIndex,
    partialToGlobalIndex: partialToGlobalIndex,
    getPartialItems: getPartialItems
};
return LazyCarousel;

});