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
var type = {
    x: 'X',
    y: 'Y'
};
var LazyCarousel = (function() {
    function LazyCarousel(elem, opts) {
        this.opts = utils.extend({}, this.defOpts);
        this.opts = utils.extend(this.opts, opts);

        this.$events = new this.opts.EventEmitter();

        this.$holder = elem;
        this.$list = null;
        this.$listHolder = null;

        this.active = 0;
        this.activeId = 0;

        this.nav = {
            prev: false,
            next: false
        };

        this.isSimple = null;
        this.visible = 0;
        this.addition = 0;

        this.items = [];

        this.partialItems = [];
        this._partialItemsBefore = [];
        this._partialItemsAfter = [];

        this.holderSize = null;
        this.itemSize = null;
        this.offsetLeft = 0;

        this._transformProperty = '';
        this._translateZ = '';

        this.changesTracker = new this.opts.ChangesTracker(this.$list, {
            trackById: this.opts.uniqueKeyProp,
            beforeAdd: this._addItemPre.bind(this),
            afterAdd: this._addItemPost.bind(this),
            beforeRemove: this._removeItemPre.bind(this),
            afterRemove: this._removeItemPost.bind(this)
        });

        this._isBusy = false;
    }

    LazyCarousel.prototype.defOpts = {
        type: type.x,
        uniqueKeyProp: 'id',
        EventEmitter: EventEmitter,
        ChangesTracker: ChangesTracker
    };

    LazyCarousel.prototype.init = function(_elem) {
        var self = this;

        this.$holder = _elem ? _elem : this.$holder;
        this.$list = this.$holder.querySelector('ul');
        this.$listHolder = this.$list ? this.$list.parentNode : null;

        this._transformProperty = utils.getPrefixedStyleValue('transform');
        this._translateZ = utils.supportsPerspective() ? 'translateZ(0)' : '';

        this.changesTracker.init(this.$list);

        this._attachHandlers();

        this.resize();
    };

    LazyCarousel.prototype.resize = function() {
        this._fetchElementsSize();
        this._calculateVisibility();
        this._updateVisible();
        this._centerList();

        this._notifyNavChange();
    };

    LazyCarousel.prototype.updateItems = function(items, _active) {
        this.items = (items && items.length) ?  items : [];
        var oldActive = this.active;
        this.active = _active || 0;

        this._fetchElementsSize();
        this._calculateVisibility();
        this._updateVisible();
        this._centerList();

        this._notifyActiveChange(this.active, true, oldActive, 0);
        this._notifyNavChange();
    };
    LazyCarousel.prototype._fetchElementsSize = function() {
        if (!this.$list || !this.$listHolder) {
            return;
        }
        var prop = (this.opts.type === type.x) ? 'clientWidth' : 'clientHeight';

        this.holderSize = this.$listHolder ? this.$listHolder[prop] : null;

        var item = this.$list ? this.$list.querySelector('li') : null;

        if (item) {
            this.itemSize = item[prop];
        }
        else {
            item = utils.appendElement(this.$list, '<li class="item"></li>');
            this.itemSize = item[prop];
            this.$list.removeChild(item);
        }
    };
    LazyCarousel.prototype._calculateVisibility = function() {
        var isSimple = true,
            visible = 0,
            addition = 0,
            count = this.items.length;

        visible = Math.floor(this.holderSize/this.itemSize) + 1;
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

        this.isSimple = isSimple;
        this.visible = visible;
        this.addition = addition;
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

        var offsetLeft = this._calculateOffset();

        this._setOffset(offsetLeft);
    };

    LazyCarousel.prototype._notifyActiveChange = function(active, _force, _oldActive, _dir) {
        if (this.active !== active || _force) {
            var oldActiveIndex = LazyCarousel.utils.globalToPartialIndex(_oldActive,
                                                                            0,
                                                                            this.items.length,
                                                                            this.partialItems.length,
                                                                            this.isSimple);

            var newActiveIndex = LazyCarousel.utils.globalToPartialIndex(active,
                                                                            0,
                                                                            this.items.length,
                                                                            this.partialItems.length,
                                                                            this.isSimple);

            this.$events.emit('changeActiveBefore', {
                oldActive: _oldActive,
                newActive: active,
                $oldActiveItem: this.$list.children[oldActiveIndex],
                $newActiveItem: this.$list.children[newActiveIndex],
                dir: _dir || 0
            });

            var activeItem = this.items[active];
            if (activeItem) {
                this.$events.emit('activeChange', {
                    index: active,
                    id: activeItem[this.opts.uniqueKeyProp]
                });
            }
        }
    };
    LazyCarousel.prototype._notifyNavChange = function() {
        var hasNext = this._getMaxSlideCount(1) > 0 ? true : false,
            hasPrev = this._getMaxSlideCount(-1) > 0 ? true : false;

        if (this.nav.prev !== hasPrev || this.nav.next !== hasNext) {
            this.nav.prev = hasPrev;
            this.nav.next = hasNext;

            this.$events.emit('navChange', {
                prev: this.nav.prev,
                next: this.nav.next
            });
        }
    };

    LazyCarousel.prototype._setOffset = function(offsetLeft, _notSave) {
        this.$list.style[this._transformProperty] = 'translate'+ this.opts.type +'('+ offsetLeft +'px) ' + this._translateZ;

        if (!_notSave) {
            this.offsetLeft = offsetLeft;
        }
    };
    LazyCarousel.prototype._getOffset = function() {
        return this.offsetLeft;
    };

    LazyCarousel.prototype._calculateOffset = function(_offset) {
        var offsetLeft,
            beforeItemsCount;

        if (this.isSimple) {
            beforeItemsCount = LazyCarousel.utils.globalToPartialIndex(this.active, 0, this.items.length, this.partialItems.length, this.isSimple);
        }
        else {
            beforeItemsCount = LazyCarousel.utils.globalToPartialIndex(0, 0, this.items.length, this.partialItems.length, this.isSimple);
        }

        if (beforeItemsCount < 0) {
            return this._getOffset();
        }

        offsetLeft = this.holderSize/2 - this.itemSize/2 - (beforeItemsCount * this.itemSize);

        if (_offset) {
            offsetLeft -= (_offset * this.itemSize);
        }

        return offsetLeft;
    };

    LazyCarousel.prototype.slideToIndex = function(index) {
        var curPos = LazyCarousel.utils.globalToPartialIndex(this.active,
                                                            0,
                                                            this.items.length,
                                                            this.partialItems.length,
                                                            this.isSimple);

        var destPos = LazyCarousel.utils.globalToPartialIndex(index,
                                                            0,
                                                            this.items.length,
                                                            this.partialItems.length,
                                                            this.isSimple);
        if (curPos < 0 || destPos < 0) {
            return Promise.resolve();
        }

        var dir = destPos > curPos ? 1 : -1,
            count = Math.abs(destPos - curPos);

        return this.slideToDir(dir, count);
    };
    LazyCarousel.prototype.slideToDir = function(dir, _count, _fast) {
        var count = 1;
        if (typeof _count === 'number') {
            count = _count;
        }

        if (this._isBusy) {
            return Promise.resolve();
        }

        var maxCount = this._getMaxSlideCount(dir);

        if (count > maxCount) {
            count = maxCount;
        }

        var newIndex = this.active + (dir * count);
        newIndex = LazyCarousel.utils.normalizeIndex(newIndex, this.items.length);

        if (newIndex === this.active) {
            return Promise.resolve();
        }

        var fromOffset = this._getOffset(),
            toOffset = this._calculateOffset(dir * count),
            duration = _fast ? 0 : 500;

        this._isBusy = true;

        if (utils.supportsTransitions()) {
            this._notifyActiveChange(newIndex, false, this.active, dir);
        }

        return this._animateOffset(fromOffset, toOffset, duration)
        .then(function() {
            if (!utils.supportsTransitions()) {
                this._notifyActiveChange(newIndex, false, this.active, dir);
            }
            this._isBusy = false;
            var oldActive = this.active;
            this.active = newIndex;
            this._notifyNavChange();
            this._setOffset(toOffset);
            this._updateVisible();
            this._centerList();

            var oldActiveIndex = LazyCarousel.utils.globalToPartialIndex(oldActive,
                                                                            0,
                                                                            this.items.length,
                                                                            this.partialItems.length,
                                                                            this.isSimple);

            var newActiveIndex = LazyCarousel.utils.globalToPartialIndex(this.active,
                                                                            0,
                                                                            this.items.length,
                                                                            this.partialItems.length,
                                                                            this.isSimple);

            this.$events.emit('changeActiveAfter', {
                oldActive: oldActive,
                newActive: this.active,
                $oldActiveItem: this.$list.children[oldActiveIndex],
                $newActiveItem: this.$list.children[newActiveIndex],
                dir: dir
            });
        }.bind(this))
        .catch(function(error){
            console.error(error);
        });
    };

    LazyCarousel.prototype._animateOffset = function(from, to, duration) {
        var transformProperty = this._transformProperty,
            translateZ = this._translateZ,
            type = this.opts.type;

        return new Promise(function(resolve, reject) {
            var self = this;

            if (!duration) {
                this._setOffset(to, true);
                resolve();
            }
            else {
                if (utils.supportsTransitions()) {
                    // css3 transition
                    utils.animateCss(this.$list,
                        {
                            'transform' : 'translate'+ type +'('+ to +'px) ' + translateZ
                        },
                        {
                            duration : duration,
                            onComplete : resolve
                        }
                    );
                }
                else {
                    move(this.$list, to, from, duration, resolve);
                }
            }
        }.bind(this));

        function move($elem, to, from, duration, complete, self) {
            var delta = to - from;

            animate({
                duration: duration,
                step: function(progress) {
                    var curOffset = from + delta * progress;
                    $elem.style[transformProperty] = 'translate'+ type +'('+ curOffset +'px) ' + translateZ;
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

                if (progress === 1) {
                    clearInterval(id);
                    opts.complete();
                }
            }, opts.delay || 10);
        }
    };

    LazyCarousel.prototype._getMaxSlideCount = function(dir) {
        var count;

        // TODO: test

        if (this.isSimple) {
            var beforeItemsCount = LazyCarousel.utils.globalToPartialIndex(this.active, 0, this.items.length, this.partialItems.length, this.isSimple);

            if (dir > 0) {
                count = this.items.length - beforeItemsCount - 1;
            }
            else {
                count = beforeItemsCount;
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
        var idKey = this.opts.uniqueKeyProp;
        return '<li class="lc-item" data-id="'+ item[idKey] +'">'+ item[idKey] +'</li>';
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

    LazyCarousel.create = function(elem, opts){
        var inst = new LazyCarousel(elem, opts);
        inst.init();
        return inst;
    };
    LazyCarousel.type = type;

    return LazyCarousel;
})();

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
        index = 0;
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
        item.$index = normalIndex;
        afterHalfArr.push(item);
    }

    // collect before items
    for(var j = index - 1, l = 0; l < beforeHalf; j--, l++) {
        normalIndex = normalizeIndex(j, globalCount);
        item = list[normalIndex];
        item.$index = normalIndex;
        beforeHalfArr.push(item);
    }

    res.list = beforeHalfArr.reverse().concat(afterHalfArr);

    res.after = afterHalfArr;
    res.before = beforeHalfArr;

    return res;
}

// Export
LazyCarousel.utils = {
    getItemInfoById: getItemInfoById,
    normalizeIndex: normalizeIndex,
    globalToPartialIndex: globalToPartialIndex,
    partialToGlobalIndex: partialToGlobalIndex,
    getPartialItems: getPartialItems
};

export default LazyCarousel;
