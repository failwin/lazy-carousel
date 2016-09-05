import { Promise } from  'es6-promise';
import { EventEmitter } from 'events';
import utils from 'my-utils';

import ChangesTracker from './ChangesTracker.js';

import styles from './base.css';

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
        this.offsetLeft = 0;

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
        this._centerList();
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
        this._centerList();
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
    LazyCarousel.prototype._centerList = function() {
        var active = this.active,
            visible = this.visible,
            addition = this.addition;

        var offsetLeft = this._calculateOffset(this.active);

        this._setOffset(offsetLeft, true);
    };

    LazyCarousel.prototype._setOffset = function(offsetLeft, _save) {
        this.$list.style.left = offsetLeft + 'px';

        if (_save){
            this.offsetLeft = offsetLeft;
        }
    };
    LazyCarousel.prototype._getOffset = function() {
        return this.offsetLeft;
    };

    LazyCarousel.prototype._calculateOffset = function(_offset) {
        var offsetLeft;

        var leftItemsCount = LazyCarousel.utils.globalToPartialIndex(0, 0, this.items.length, this.partialItems.length, this.isSimple);

        if (leftItemsCount < 0) {
            return this.offsetLeft;
        }
        // TODO:

        offsetLeft = this.holderWidth/2 - this.itemWidth/2 - (leftItemsCount * this.itemWidth);

        //if (this.isSimple) {
        //    offsetLeft = this._holderWidth/2 - this._itemWidth/2;
        //
        //    offsetLeft = offsetLeft - ((Math.floor(count/2) + index) * this._itemWidth);
        //}
        //else {
        //    if (_isDir) {
        //        var dir = _index;
        //        offsetLeft = this._offsetLeft - (dir * this._itemWidth);
        //    }
        //    else {
        //        index = _index || 0; // element at the center
        //
        //        offsetLeft = this._holderWidth/2 - this._itemWidth/2;
        //
        //        offsetLeft = offsetLeft - (addition + Math.floor(visible/2) + index) * this._itemWidth;
        //
        //    }
        //}

        return offsetLeft;
    };

    LazyCarousel.prototype.slideToIndex = function() {

    };
    LazyCarousel.prototype.slideToDir = function(dir, _count, _fast) {
        var count = 1;
        if (typeof _count === 'number') {
            count = _count;
        }

        var maxCount = this._getMaxSlideCount(dir);

        if (count > maxCount) {
            count = maxCount;
        }

        var newIndex = this.active + (dir * count);
        newIndex = LazyCarousel.utils.normalizeIndex(newIndex, this.items.length);

        return this._animateOffset(newIndex, _fast)
        .then(function() {
            this.active = newIndex;
            this._updateVisible();
            this._centerList();
        }.bind(this));
    };

    LazyCarousel.prototype._animateOffset = function(newIndex, _fast) {
        return new Promise(function(resolve, reject) {
            var self = this;

            resolve();
        }.bind(this));
    };

    LazyCarousel.prototype._getMaxSlideCount = function(dir) {
        var count;

        if (this.isSimple) {
            if (dir > 0) {
                count = this.items.length - this.active - 1;
            }
            else {
                count = this.active;
            }
        }
        else {
            count = this.visible;
        }

        return count;
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

function getItemInfoById(id, _list, _key) {
    var list = _list || [],
        key = _key || 'id';

    for (var i = 0, c = list.length; i < c; i++){
        /*eslint-disable */
        if (list[i][key] == id) {
        /*eslint-enable */
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

function globalToPartialIndex(index, startIndex, globalCount, partialCount, _isSimple) {
    var partialIndex = -1,
        beforeHalf,
        afterHalf,
        normalIndex,
        afterArr = [],
        beforeArr = [],
        arr;

    // take before/after count
    beforeHalf = Math.floor(partialCount/2);
    afterHalf = partialCount - beforeHalf;

    if (_isSimple) {
        // shift list into right by 1
        if (beforeHalf === afterHalf) {
            beforeHalf--;
            afterHalf++;
        }
    }

    // collect after items
    for(var i = startIndex, k = 0; k < afterHalf; i++, k++) {
        normalIndex = normalizeIndex(i, globalCount);
        afterArr.push(normalIndex);
    }

    // collect before items
    for(var j = startIndex - 1, l = 0; l < beforeHalf; j--, l++) {
        normalIndex = normalizeIndex(j, globalCount);
        beforeArr.push(normalIndex);
    }

    arr = beforeArr.reverse().concat(afterArr);

    //console.log(arr);

    arr.forEach(function(ii, partInd){
        if (ii === index) {
            partialIndex = partInd;
        }
    });

    return partialIndex;
}
function partialToGlobalIndex(index, startIndex, globalCount, partialCount, _isSimple) {
    var globalIndex = -1,
        beforeHalf,
        afterHalf,
        normalIndex,
        afterArr = [],
        beforeArr = [],
        arr;

    // take before/after count
    beforeHalf = Math.floor(partialCount/2);
    afterHalf = partialCount - beforeHalf;

    if (_isSimple) {
        // shift list into right by 1
        if (beforeHalf === afterHalf) {
            beforeHalf--;
            afterHalf++;
        }
    }

    // collect after items
    for(var i = startIndex, k = 0; k < afterHalf; i++, k++) {
        normalIndex = normalizeIndex(i, globalCount);
        afterArr.push(normalIndex);
    }

    // collect before items
    for(var j = startIndex - 1, l = 0; l < beforeHalf; j--, l++) {
        normalIndex = normalizeIndex(j, globalCount);
        beforeArr.push(normalIndex);
    }

    arr = beforeArr.reverse().concat(afterArr);

    //console.log(arr);

    if (typeof arr[index] !== 'undefined') {
        globalIndex = arr[index];
    }

    return globalIndex;
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
        normalIndex,
        item;


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
        if (beforeHalf === afterHalf) {
            beforeHalf--;
            afterHalf++;
        }
    }

    // collect after items
    for(var i = index, k = 0; k < afterHalf; i++, k++) {
        normalIndex = normalizeIndex(i, globalCount);
        item = list[normalIndex];
        item.__i = normalIndex; // global index
        afterHalfArr.push(item);
    }

    // collect before items
    for(var j = index - 1, l = 0; l < beforeHalf; j--, l++) {
        normalIndex = normalizeIndex(j, globalCount);
        item = list[normalIndex];
        item.__i = normalIndex; // global index
        beforeHalfArr.push(item);
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

export default LazyCarousel;
