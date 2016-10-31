(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("es6-promise"), require("my-utils"));
	else if(typeof define === 'function' && define.amd)
		define(["es6-promise", "my-utils"], factory);
	else if(typeof exports === 'object')
		exports["LazyCarousel"] = factory(require("es6-promise"), require("my-utils"));
	else
		root["LazyCarousel"] = factory(root["ES6Promise"], root["utils"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_5__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/dist/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.keyHandlerDecorator = exports.swipeDecorator = undefined;

	var _LazyCarousel = __webpack_require__(2);

	var _LazyCarousel2 = _interopRequireDefault(_LazyCarousel);

	var _SwipeDecorator = __webpack_require__(8);

	var _SwipeDecorator2 = _interopRequireDefault(_SwipeDecorator);

	var _KeyHandlerDecorator = __webpack_require__(9);

	var _KeyHandlerDecorator2 = _interopRequireDefault(_KeyHandlerDecorator);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = _LazyCarousel2.default;
	exports.swipeDecorator = _SwipeDecorator2.default;
	exports.keyHandlerDecorator = _KeyHandlerDecorator2.default;

	//export default from './LazyCarousel.js';
	//export swipeDecorator, { SwipeDecorator } from './SwipeDecorator.js';
	//export keyHandlerDecorator, { KeyHandlerDecorator } from './KeyHandlerDecorator.js';
	//export myLazyCarouselModule from './MyLazyCarouselAngular.js';

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _es6Promise = __webpack_require__(3);

	var _events = __webpack_require__(4);

	var _myUtils = __webpack_require__(5);

	var _myUtils2 = _interopRequireDefault(_myUtils);

	var _ChangesTracker = __webpack_require__(6);

	var _ChangesTracker2 = _interopRequireDefault(_ChangesTracker);

	var _base = __webpack_require__(7);

	var _base2 = _interopRequireDefault(_base);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var debug = false;
	var logLevel = ['calls', 'calls res']; // 'calls', 'calls res'
	var log = function log() {
	    var args = [].slice.call(arguments, 0);
	    if (logLevel.indexOf(args.shift()) > -1) {
	        console.log(args);
	    }
	};
	var type = {
	    x: 'X',
	    y: 'Y'
	};
	var LazyCarousel = function () {
	    function LazyCarousel(elem, opts) {
	        this.opts = _myUtils2.default.extend({}, this.defOpts);
	        this.opts = _myUtils2.default.extend(this.opts, opts);

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
	        EventEmitter: _events.EventEmitter,
	        ChangesTracker: _ChangesTracker2.default
	    };

	    LazyCarousel.prototype.init = function (_elem) {
	        var self = this;

	        this.$holder = _elem ? _elem : this.$holder;
	        this.$list = this.$holder.querySelector('ul');
	        this.$listHolder = this.$list ? this.$list.parentNode : null;

	        this._transformProperty = _myUtils2.default.getPrefixedStyleValue('transform');
	        this._translateZ = _myUtils2.default.supportsPerspective() ? 'translateZ(0)' : '';

	        this.changesTracker.init(this.$list);

	        this._attachHandlers();

	        this.resize();
	    };

	    LazyCarousel.prototype.resize = function () {
	        this._fetchElementsSize();
	        this._calculateVisibility();
	        this._updateVisible();
	        this._centerList();

	        this._notifyNavChange();
	    };

	    LazyCarousel.prototype.updateItems = function (items, _active) {
	        this.items = items && items.length ? items : [];
	        var oldActive = this.active;
	        this.active = _active || 0;

	        this._fetchElementsSize();
	        this._calculateVisibility();
	        this._updateVisible();
	        this._centerList();

	        this._notifyActiveChange(this.active, true, oldActive, 0);
	        this._notifyNavChange();
	    };
	    LazyCarousel.prototype._fetchElementsSize = function () {
	        if (!this.$list || !this.$listHolder) {
	            return;
	        }
	        var prop = this.opts.type === type.x ? 'clientWidth' : 'clientHeight';

	        this.holderSize = this.$listHolder ? this.$listHolder[prop] : null;

	        var item = this.$list ? this.$list.querySelector('li') : null;

	        if (item) {
	            this.itemSize = item[prop];
	        } else {
	            item = _myUtils2.default.appendElement(this.$list, '<li class="item"></li>');
	            this.itemSize = item[prop];
	            this.$list.removeChild(item);
	        }
	    };
	    LazyCarousel.prototype._calculateVisibility = function () {
	        var isSimple = true,
	            visible = 0,
	            addition = 0,
	            count = this.items.length;

	        visible = Math.floor(this.holderSize / this.itemSize) + 1;
	        if (visible % 2 === 0) {
	            // 0 2 4 6
	            visible++; // 1 3 5 7
	        }

	        visible = Math.min(count, visible);

	        if (3 * visible >= count) {
	            isSimple = true;
	        } else {
	            isSimple = false;
	            addition = visible;
	        }

	        this.isSimple = isSimple;
	        this.visible = visible;
	        this.addition = addition;
	    };
	    LazyCarousel.prototype._updateVisible = function () {
	        var partials = LazyCarousel.utils.getPartialItems(this.items, this.active, this.visible, this.addition, this.isSimple);

	        this.partialItems = partials.list;
	        this._partialItemsBefore = partials.before;
	        this._partialItemsAfter = partials.after;

	        this.changesTracker.updateList(this.partialItems);
	    };
	    LazyCarousel.prototype._centerList = function () {
	        var active = this.active,
	            visible = this.visible,
	            addition = this.addition;

	        var offsetLeft = this._calculateOffset();

	        this._setOffset(offsetLeft);
	    };

	    LazyCarousel.prototype._notifyActiveChange = function (active, _force, _oldActive, _dir) {
	        if (this.active !== active || _force) {
	            var oldActiveIndex = LazyCarousel.utils.globalToPartialIndex(_oldActive, 0, this.items.length, this.partialItems.length, this.isSimple);

	            var newActiveIndex = LazyCarousel.utils.globalToPartialIndex(active, 0, this.items.length, this.partialItems.length, this.isSimple);

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
	    LazyCarousel.prototype._notifyNavChange = function () {
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

	    LazyCarousel.prototype._setOffset = function (offsetLeft, _notSave) {
	        this.$list.style[this._transformProperty] = 'translate' + this.opts.type + '(' + offsetLeft + 'px) ' + this._translateZ;

	        if (!_notSave) {
	            this.offsetLeft = offsetLeft;
	        }
	    };
	    LazyCarousel.prototype._getOffset = function () {
	        return this.offsetLeft;
	    };

	    LazyCarousel.prototype._calculateOffset = function (_offset) {
	        var offsetLeft, beforeItemsCount;

	        if (this.isSimple) {
	            beforeItemsCount = LazyCarousel.utils.globalToPartialIndex(this.active, 0, this.items.length, this.partialItems.length, this.isSimple);
	        } else {
	            beforeItemsCount = LazyCarousel.utils.globalToPartialIndex(0, 0, this.items.length, this.partialItems.length, this.isSimple);
	        }

	        if (beforeItemsCount < 0) {
	            return this._getOffset();
	        }

	        offsetLeft = this.holderSize / 2 - this.itemSize / 2 - beforeItemsCount * this.itemSize;

	        if (_offset) {
	            offsetLeft -= _offset * this.itemSize;
	        }

	        return offsetLeft;
	    };

	    LazyCarousel.prototype.slideToIndex = function (index) {
	        var curPos = LazyCarousel.utils.globalToPartialIndex(this.active, 0, this.items.length, this.partialItems.length, this.isSimple);

	        var destPos = LazyCarousel.utils.globalToPartialIndex(index, 0, this.items.length, this.partialItems.length, this.isSimple);
	        if (curPos < 0 || destPos < 0) {
	            return _es6Promise.Promise.resolve();
	        }

	        var dir = destPos > curPos ? 1 : -1,
	            count = Math.abs(destPos - curPos);

	        return this.slideToDir(dir, count);
	    };
	    LazyCarousel.prototype.slideToDir = function (dir, _count, _fast) {
	        var count = 1;
	        if (typeof _count === 'number') {
	            count = _count;
	        }

	        if (this._isBusy) {
	            return _es6Promise.Promise.reject();
	        }

	        var maxCount = this._getMaxSlideCount(dir);

	        if (count > maxCount) {
	            count = maxCount;
	        }

	        var newIndex = this.active + dir * count;
	        newIndex = LazyCarousel.utils.normalizeIndex(newIndex, this.items.length);

	        if (newIndex === this.active) {
	            return _es6Promise.Promise.resolve();
	        }

	        var fromOffset = this._getOffset(),
	            toOffset = this._calculateOffset(dir * count),
	            duration = _fast ? 0 : 500;

	        this._isBusy = true;

	        if (_myUtils2.default.supportsTransitions()) {
	            this._notifyActiveChange(newIndex, false, this.active, dir);
	        }

	        return this._animateOffset(fromOffset, toOffset, duration).then(function () {
	            if (!_myUtils2.default.supportsTransitions()) {
	                this._notifyActiveChange(newIndex, false, this.active, dir);
	            }
	            this._isBusy = false;
	            var oldActive = this.active;
	            this.active = newIndex;
	            this._notifyNavChange();
	            this._setOffset(toOffset);
	            this._updateVisible();
	            this._centerList();

	            var oldActiveIndex = LazyCarousel.utils.globalToPartialIndex(oldActive, 0, this.items.length, this.partialItems.length, this.isSimple);

	            var newActiveIndex = LazyCarousel.utils.globalToPartialIndex(this.active, 0, this.items.length, this.partialItems.length, this.isSimple);

	            this.$events.emit('changeActiveAfter', {
	                oldActive: oldActive,
	                newActive: this.active,
	                $oldActiveItem: this.$list.children[oldActiveIndex],
	                $newActiveItem: this.$list.children[newActiveIndex],
	                dir: dir
	            });
	        }.bind(this)).catch(function (error) {
	            console.error(error);
	        });
	    };

	    LazyCarousel.prototype._animateOffset = function (from, to, duration) {
	        var transformProperty = this._transformProperty,
	            translateZ = this._translateZ,
	            type = this.opts.type;

	        return new _es6Promise.Promise(function (resolve, reject) {
	            var self = this;

	            if (!duration) {
	                this._setOffset(to, true);
	                resolve();
	            } else {
	                if (_myUtils2.default.supportsTransitions()) {
	                    // css3 transition
	                    _myUtils2.default.animateCss(this.$list, {
	                        'transform': 'translate' + type + '(' + to + 'px) ' + translateZ
	                    }, {
	                        duration: duration,
	                        onComplete: resolve
	                    });
	                } else {
	                    move(this.$list, to, from, duration, resolve);
	                }
	            }
	        }.bind(this));

	        function move($elem, to, from, duration, complete, self) {
	            var delta = to - from;

	            animate({
	                duration: duration,
	                step: function step(progress) {
	                    var curOffset = from + delta * progress;
	                    $elem.style[transformProperty] = 'translate' + type + '(' + curOffset + 'px) ' + translateZ;
	                },
	                complete: complete
	            });
	        }

	        function animate(opts) {
	            var start = Date.now();

	            opts.easing = opts.easing || function (p) {
	                return p;
	            };

	            opts.duration = opts.duration || 300;

	            opts.complete = opts.complete || function () {};

	            var id = setInterval(function () {
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

	    LazyCarousel.prototype._getMaxSlideCount = function (dir) {
	        var count;

	        // TODO: test

	        if (this.isSimple) {
	            var beforeItemsCount = LazyCarousel.utils.globalToPartialIndex(this.active, 0, this.items.length, this.partialItems.length, this.isSimple);

	            if (dir > 0) {
	                count = this.items.length - beforeItemsCount - 1;
	            } else {
	                count = beforeItemsCount;
	            }
	        } else {
	            count = this.visible;
	        }

	        return count;
	    };

	    LazyCarousel.prototype._addItemPre = function (item, callback) {
	        callback = callback || function () {};

	        var itemStr = this._getItemTemplate(item),
	            $item = _myUtils2.default.createElement(itemStr);

	        callback($item);
	    };
	    LazyCarousel.prototype._addItemPost = function (item, $item) {};

	    LazyCarousel.prototype._removeItemPre = function (item, $item, callback) {
	        callback = callback || function () {};

	        callback();
	    };
	    LazyCarousel.prototype._removeItemPost = function ($item) {};

	    LazyCarousel.prototype._getItemTemplate = function (item) {
	        var idKey = this.opts.uniqueKeyProp;
	        return '<li class="lc-item" data-id="' + item[idKey] + '">' + item[idKey] + '</li>';
	    };

	    LazyCarousel.prototype._attachHandlers = function () {
	        window.addEventListener('resize', this, false);
	        window.addEventListener('orientationchange', this, false);
	        window.addEventListener('msOrientationChange', this, false);
	        window.addEventListener('mozOrientationChange', this, false);
	        window.addEventListener('webkitOrientationChange', this, false);
	    };
	    LazyCarousel.prototype._detachHandlers = function () {
	        window.removeEventListener('resize', this, false);
	        window.removeEventListener('orientationchange', this, false);
	        window.removeEventListener('msOrientationChange', this, false);
	        window.removeEventListener('mozOrientationChange', this, false);
	        window.removeEventListener('webkitOrientationChange', this, false);
	    };

	    LazyCarousel.prototype.handleEvent = function (event) {
	        switch (event.type) {
	            case 'resize':
	            case 'orientationchange':
	            case 'msOrientationChange':
	            case 'mozOrientationChange':
	            case 'webkitOrientationChange':
	                {
	                    this._resizeHandler(event);
	                    break;
	                }
	            default:
	                {

	                    break;
	                }
	        }
	    };

	    LazyCarousel.prototype._resizeHandler = function (event) {
	        this.resize();
	    };

	    LazyCarousel.prototype.destroy = function () {
	        this._detachHandlers();
	    };

	    LazyCarousel.create = function (elem, opts) {
	        var inst = new LazyCarousel(elem, opts);
	        inst.init();
	        return inst;
	    };
	    LazyCarousel.type = type;

	    return LazyCarousel;
	}();

	function getItemInfoById(id, _list, _key) {
	    var list = _list || [],
	        key = _key || 'id';

	    for (var i = 0, c = list.length; i < c; i++) {
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
	    var parts = Math.floor(Math.abs(index / count));

	    if (dir < 0) {
	        parts++;
	        newActive = index - count * parts * dir;

	        return normalizeIndex(newActive, count);
	    } else {
	        newActive = index - count * parts * dir;
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
	    beforeHalf = Math.floor(partialCount / 2);
	    afterHalf = partialCount - beforeHalf;

	    if (_isSimple) {
	        // shift list into right by 1
	        if (beforeHalf === afterHalf) {
	            beforeHalf--;
	            afterHalf++;
	        }
	    }

	    // collect after items
	    for (var i = startIndex, k = 0; k < afterHalf; i++, k++) {
	        normalIndex = normalizeIndex(i, globalCount);
	        afterArr.push(normalIndex);
	    }

	    // collect before items
	    for (var j = startIndex - 1, l = 0; l < beforeHalf; j--, l++) {
	        normalIndex = normalizeIndex(j, globalCount);
	        beforeArr.push(normalIndex);
	    }

	    arr = beforeArr.reverse().concat(afterArr);

	    //console.log(arr);

	    arr.forEach(function (ii, partInd) {
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
	    beforeHalf = Math.floor(partialCount / 2);
	    afterHalf = partialCount - beforeHalf;

	    if (_isSimple) {
	        // shift list into right by 1
	        if (beforeHalf === afterHalf) {
	            beforeHalf--;
	            afterHalf++;
	        }
	    }

	    // collect after items
	    for (var i = startIndex, k = 0; k < afterHalf; i++, k++) {
	        normalIndex = normalizeIndex(i, globalCount);
	        afterArr.push(normalIndex);
	    }

	    // collect before items
	    for (var j = startIndex - 1, l = 0; l < beforeHalf; j--, l++) {
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
	    beforeHalf = Math.floor(count / 2);
	    afterHalf = count - beforeHalf;

	    if (isSimple) {
	        // shift list into right by 1
	        if (beforeHalf === afterHalf) {
	            beforeHalf--;
	            afterHalf++;
	        }
	    }

	    // collect after items
	    for (var i = index, k = 0; k < afterHalf; i++, k++) {
	        normalIndex = normalizeIndex(i, globalCount);
	        item = list[normalIndex];
	        afterHalfArr.push(item);
	    }

	    // collect before items
	    for (var j = index - 1, l = 0; l < beforeHalf; j--, l++) {
	        normalIndex = normalizeIndex(j, globalCount);
	        item = list[normalIndex];
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

	exports.default = LazyCarousel;

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];

	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var NG_REMOVED = '$$MY_NG_REMOVED';

	function isArray(obj) {
	    if (Array.isArray) {
	        return Array.isArray(obj);
	    }
	    return Object.prototype.toString.call(obj) === '[object Array]';
	}
	function isObject(obj) {
	    var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
	    return type === 'function' || type === 'object' && !!obj;
	}
	function isFunction(obj) {
	    return Object.prototype.toString.call(obj) === '[object ' + name + ']';
	}

	function extend(obj, prop, isDeep) {
	    var src,
	        copyIsArray,
	        copy,
	        name,
	        clone,
	        target = obj || {},
	        i = 1,
	        length = arguments.length,
	        deep = isDeep,
	        options = prop;

	    // Handle case when target is a string or something (possible in deep copy)
	    if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) !== "object" && !isFunction(target)) {
	        target = {};
	    }

	    for (name in options) {
	        if (prop.hasOwnProperty(name)) {
	            src = target[name];
	            copy = options[name];

	            // Prevent never-ending loop
	            if (target === copy) {
	                continue;
	            }

	            // Recurse if we're merging plain objects or arrays
	            if (deep && copy && (copyIsArray = isArray(copy))) {
	                if (copyIsArray) {
	                    copyIsArray = false;
	                    clone = src && isArray(src) ? src : [];
	                } else {
	                    clone = src ? src : {};
	                }

	                // Never move original objects, clone them
	                target[name] = extend(clone, copy, deep);

	                // Don't bring in undefined values
	            } else if (copy !== undefined) {
	                target[name] = copy;
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
	    } else {

	        parent.insertBefore(element, parent.firstChild);

	        //prepend(parent, element);
	    }

	    //afterElement ? afterElement.after(element) : parentElement.prepend(element);
	}

	var ChangesTracker = function () {
	    function ChangesTracker(element, opts) {
	        this.opts = extend({}, this.defOpts);
	        this.opts = extend(this.opts, opts);

	        this.$element = element;

	        this.$startComment = null;

	        this.lastBlockMap = null;

	        if (element) {
	            this.init();
	        }
	    }

	    ChangesTracker.prototype.defOpts = {
	        debug: false,
	        trackById: 'id',
	        trackByIdFn: function trackByIdFn(key, value, index, trackById) {
	            return value[trackById];
	        },
	        beforeAdd: function beforeAdd(data, callback) {
	            callback = callback || function () {};

	            var elem = createElement('<li>' + data.id + '</li>');

	            callback(elem);
	        },
	        afterAdd: function afterAdd(data, element) {},
	        beforeRemove: function beforeRemove(data, element, callback) {
	            callback = callback || function () {};

	            callback();
	        },
	        afterRemove: function afterRemove(data) {}
	    };

	    ChangesTracker.prototype.init = function (_element) {
	        if (_element) {
	            this.$element = _element;
	        }
	        // clear
	        while (this.$element.firstChild) {
	            this.$element.removeChild(this.$element.firstChild);
	        }

	        // insert first anchor
	        this.$startComment = window.document.createComment('');
	        this.$element.appendChild(this.$startComment);

	        this.lastBlockMap = Object.create(null);
	    };

	    ChangesTracker.prototype.updateList = function (collection) {
	        var previousNode = this.$startComment,
	            nextNode,
	            nextBlockMap = Object.create(null),
	            nextBlockOrder,
	            collectionLength,
	            index,
	            key,
	            value,
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
	                nextBlockOrder.forEach(function (block) {
	                    if (block && block.data) {
	                        this.lastBlockMap[block.id] = block;
	                    }
	                }.bind(this));
	                throw new Error('Duplicates in a repeater are not allowed');
	            } else {
	                // new never before seen block
	                nextBlockOrder[index] = { id: trackById, data: undefined, element: undefined };
	                nextBlockMap[trackById] = true;
	            }
	        }

	        // remove leftover items
	        for (var blockKey in this.lastBlockMap) {
	            if (this.lastBlockMap.hasOwnProperty && !this.lastBlockMap.hasOwnProperty(blockKey)) {
	                continue;
	            }
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

	                if (block.element !== nextNode) {
	                    // existing item which got moved

	                    // $animate.move(getBlockNodes(block.clone), null, previousNode);
	                    domInsert(block.element, null, previousNode);
	                }
	                previousNode = block.element;
	            } else {
	                // new item which we don't know about
	                block.data = value;

	                /*eslint-disable */
	                this.opts.beforeAdd(block.data, function (elem) {
	                    /*eslint-enable */
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
	            block = removed[i];
	            /*eslint-disable */
	            this.opts.beforeRemove(block.data, block.element, function () {
	                /*eslint-enable */
	                this.$element.removeChild(block.element);
	                this.opts.afterRemove(block.data);
	                block = block.data = block.element = null;
	            }.bind(this));
	        }
	        removed = null;
	    };

	    return ChangesTracker;
	}();

	exports.default = ChangesTracker;

/***/ },
/* 7 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.default = swipeDecorator;

	var _myUtils = __webpack_require__(5);

	var _myUtils2 = _interopRequireDefault(_myUtils);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 *  $list
	 *  itemSize
	 *
	 *  slideToDir
	 *  _getOffset
	 *  _setOffset
	 *  _calculateOffset
	 *  _getMaxSlideCount
	 *  _attachHandlers,
	 *  _detachHandlers
	 */

	var type = {
	    x: 'X',
	    y: 'Y'
	};

	function swipeDecorator(options) {
	    var defOpts = {
	        type: type.x,
	        supportMouse: false,
	        supportTouch: true
	    };

	    return function swipeDecoratorFn(inst) {
	        var _attachHandlers = inst._attachHandlers.bind(inst),
	            _detachHandlers = inst._detachHandlers.bind(inst);

	        var opts = _myUtils2.default.extend({}, defOpts);
	        opts = _myUtils2.default.extend(opts, options);

	        inst.__swipeDecorator = true;

	        // swipe options
	        inst.swipe = {};
	        inst.swipe.opts = opts;
	        inst.swipe._isActive = false;
	        inst.swipe._lastPos = {};
	        inst.swipe._preventMove = null;
	        inst.swipe._timer = null;
	        inst.swipe._timeStamp = 0;
	        inst.swipe._velocity = 0;
	        inst.swipe._amplitude = 0;
	        inst.swipe._offset = 0;
	        inst.swipe._offsetTrack = 0;
	        inst.swipe._offsetTarget = 0;
	        inst.swipe._weight = 0.99;

	        inst.swipe._targetCount = 0;
	        inst.swipe._dir = 1;

	        inst._attachHandlers = function () {
	            _attachHandlers();

	            if (this.swipe.opts.supportTouch) {
	                // Touch
	                this.$list.addEventListener('touchstart', _touchStart, false);
	                this.$list.addEventListener('touchmove', _touchMove, false);
	                this.$list.addEventListener('touchend', _touchEnd, false);
	                this.$list.addEventListener('touchcancel', _touchEnd, false);
	            }

	            if (this.swipe.opts.supportMouse) {
	                // Mouse
	                this.$list.addEventListener('mousedown', _touchStart, false);
	                this.$list.addEventListener('mousemove', _touchMove, false);
	                this.$list.addEventListener('mouseup', _touchEnd, false);
	                this.$list.addEventListener('mouseleave', _touchEnd, false);
	            }
	        }.bind(inst);

	        inst._detachHandlers = function () {
	            _detachHandlers();

	            if (this.swipe.opts.supportTouch) {
	                // Touch
	                this.$list.removeEventListener('touchstart', _touchStart, false);
	                this.$list.removeEventListener('touchmove', _touchMove, false);
	                this.$list.removeEventListener('touchend', _touchEnd, false);
	                this.$list.removeEventListener('touchcancel', _touchEnd, false);
	            }

	            if (this.swipe.opts.supportMouse) {
	                // Mouse
	                this.$list.removeEventListener('mousedown', _touchStart, false);
	                this.$list.removeEventListener('mousemove', _touchMove, false);
	                this.$list.removeEventListener('mouseup', _touchEnd, false);
	                this.$list.removeEventListener('mouseleave', _touchEnd, false);
	            }
	        }.bind(inst);

	        var _touchStart = function (event) {
	            if (this._isBusy) {
	                return;
	            }

	            this.swipe._isActive = true;
	            this.swipe._lastPos = _getEventPosition(event);
	            this.swipe._amplitude = this.swipe._offset = 0;
	            this.swipe._velocity = 0;
	            this.swipe._offsetTrack = this.swipe._offset = this._getOffset();
	            this.swipe._timeStamp = Date.now();
	            window.clearInterval(this.swipe._timer);
	            this.swipe._timer = window.setInterval(this._track.bind(this), 100);
	        }.bind(inst);

	        var _touchMove = function (event) {
	            if (!this.swipe._isActive) {
	                return;
	            }

	            var coords = _getEventPosition(event),
	                prop = this.swipe.opts.type.toLowerCase();

	            if (this.swipe._preventMove === null) {
	                var swipeDir = _getSwipeDirection(this.swipe._lastPos, coords, this.swipe.opts.type);

	                if (swipeDir === null) {
	                    return;
	                } else if (this.swipe.opts.type === type.x && (swipeDir === 'up' || swipeDir === 'down')) {
	                    this.swipe._isActive = false;
	                    return;
	                } else if (this.swipe.opts.type === type.y && (swipeDir === 'left' || swipeDir === 'right')) {
	                    this.swipe._isActive = false;
	                    return;
	                } else {
	                    this.swipe._preventMove = true;
	                }
	            }
	            event.preventDefault();
	            event.stopPropagation();

	            var deltaX = coords[prop] - this.swipe._lastPos[prop];

	            var offset = this._getOffset() + deltaX;
	            this._setOffset(offset, true);
	            this.swipe._offset = offset;
	        }.bind(inst);

	        var _touchEnd = function (event) {
	            if (!this.swipe._isActive) {
	                return;
	            }

	            var prop = this.swipe.opts.type.toLowerCase();

	            this.swipe._isActive = false;
	            this.swipe._preventMove = null;
	            window.clearInterval(this.swipe._timer);

	            this.swipe._offsetTarget = this.swipe._offset;
	            this.swipe._targetCount = 0;

	            var coords = _getEventPosition(event);

	            this.swipe._dir = 1;
	            if (coords[prop] > this.swipe._lastPos[prop]) {
	                this.swipe._dir = -1;
	            }

	            var maxCount = this._getMaxSlideCount(this.swipe._dir);

	            if (this.swipe._velocity > 100 || this.swipe._velocity < -100) {

	                this.swipe._amplitude = this.swipe._weight * this.swipe._velocity;

	                var count = Math.abs((this.swipe._offsetTarget + this.swipe._dir * this.swipe._amplitude) / this.itemSize);

	                this.swipe._offsetTarget = this._getOffset() + this.swipe._amplitude;
	            }

	            this.swipe._targetCount = (this.swipe._offsetTarget - this._getOffset()) / this.itemSize;

	            this.swipe._targetCount = Math.round(Math.abs(this.swipe._targetCount));

	            if (this.swipe._targetCount > maxCount) {
	                this.swipe._targetCount = maxCount;
	            }

	            this.swipe._offsetTarget = this._calculateOffset(this.swipe._dir * this.swipe._targetCount);

	            this.swipe._amplitude = this.swipe._offsetTarget - this.swipe._offset;

	            this.swipe._timeStamp = Date.now();
	            requestAnimationFrame(this._animate.bind(this));
	        }.bind(inst);

	        inst._track = function (event) {
	            var now, elapsed, delta, v;

	            now = Date.now();
	            elapsed = now - this.swipe._timeStamp;
	            this.swipe._timeStamp = now;
	            delta = this.swipe._offset - this.swipe._offsetTrack;
	            this.swipe._offsetTrack = this.swipe._offset;

	            v = 1000 * delta / (1 + elapsed);
	            this.swipe._velocity = 0.8 * v + 0.2 * this.swipe._velocity;
	        }.bind(inst);
	        inst._animate = function () {
	            var now, elapsed, delta;

	            if (this.swipe._amplitude) {
	                now = Date.now();
	                elapsed = now - this.swipe._timeStamp;
	                delta = -this.swipe._amplitude * Math.exp(-elapsed / 325);
	                if (delta > 5 || delta < -5) {
	                    this._setOffset(this.swipe._offsetTarget + delta, true);
	                    requestAnimationFrame(this._animate.bind(this));
	                    this._isBusy = true;
	                } else {
	                    this._isBusy = false;
	                    this.slideToDir(this.swipe._dir, this.swipe._targetCount, true);
	                }
	            }
	        }.bind(inst);

	        var _getEventPosition = function _getEventPosition(event) {
	            var originalEvent = event.originalEvent || event;
	            var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
	            var e = originalEvent.changedTouches && originalEvent.changedTouches[0] || touches[0];

	            return {
	                x: e.clientX,
	                y: e.clientY
	            };
	        };

	        var _getSwipeDirection = function _getSwipeDirection(startPoint, endPoint) {
	            var x = startPoint.x - endPoint.x,
	                y = startPoint.y - endPoint.y;

	            var xAbs = Math.abs(x),
	                yAbs = Math.abs(y);

	            if (xAbs < 25 && yAbs < 25) {
	                return null;
	            }

	            if (xAbs > yAbs) {
	                if (x > 0) {
	                    return 'left';
	                }
	                return 'right';
	            } else {
	                if (y > 0) {
	                    return 'up';
	                }
	                return 'down';
	            }
	        };

	        //return SwipeDecorator(inst, options);
	        return inst;
	    };
	}
	swipeDecorator.type = type;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.default = keyHandlerDecorator;

	var _myUtils = __webpack_require__(5);

	var _myUtils2 = _interopRequireDefault(_myUtils);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 *  slideToDir
	 *  _attachHandlers,
	 *  _detachHandlers
	 */

	function keyHandlerDecorator(options) {
	    return function (inst) {
	        var _attachHandlers = inst._attachHandlers.bind(inst),
	            _detachHandlers = inst._detachHandlers.bind(inst);

	        inst.__keyHandlerDecorator = true;
	        inst._attachHandlers = function () {
	            _attachHandlers();

	            document.addEventListener('keyup', _keyHandler, false);
	        };

	        inst._detachHandlers = function () {
	            _detachHandlers();

	            document.removeEventListener('keyup', _keyHandler, false);
	        };

	        var _keyHandler = function (event) {
	            var keyCode = event.which || event.keyCode;

	            if (keyCode === 39 || keyCode === 37) {
	                var dir = 1;
	                if (keyCode === 37) {
	                    dir = -1;
	                }
	                this.slideToDir(dir);
	            }
	        }.bind(inst);

	        //return KeyHandlerDecorator(inst, options);
	        return inst;
	    };
	}

/***/ }
/******/ ])
});
;
//# sourceMappingURL=LazyCarousel.js.map