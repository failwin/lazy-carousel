(function(window, document, undefined){
'use strict';

// Import
var Promise = window.ES6Promise.Promise;
var EventEmitter = window.events.EventEmitter;
var utils = window.utils;

var LazyCarousel = (function() {
    function LazyCarousel(elem, opts) {
        this.opts = utils.extend({}, this.defOpts);
        this.opts = utils.extend(this.opts, opts);

        this.$holder = elem ? elem : null;
        this.$wrapper = null;
        this.$list = null;

        if (!this.opts.noInit) {
            this.init();
        }
    }

    LazyCarousel.prototype.defOpts = {
        noInit: false,
        itemWidth: 50
    };

    LazyCarousel.prototype.init = function(elem) {
        var self = this;

        this.$holder = elem ? elem : this.$holder;

        if (!this.$holder) {
            throw new Error('LazyCarousel.$holder not found.');
        }

        this.$list = this.$holder.querySelector('ul');

        if (!this.$list) {
            throw new Error('LazyCarousel.$list not found.');
        }

        this.$wrapper = this.$list.parentNode;

        this._transformProperty = utils.getPrefixedStyleValue('transform');
        this._translateZ = utils.supportsPerspective() ? 'translateZ(0)' : '';

        this.resize();
    };
    LazyCarousel.prototype.destroy = function() {

    };

    LazyCarousel.prototype.resize = function() {

    };

    LazyCarousel.prototype._calculateVisibility = function(_holderWidth, _itemWidth, _count) {
        var holderWidth = this._holderWidth,
            itemWidth = this._itemWidth,
            count = this._count;

        if (typeof _holderWidth !== 'undefined') {
            holderWidth = _holderWidth;
        }
        if (typeof _itemWidth !== 'undefined') {
            itemWidth = _itemWidth;
        }
        if (typeof _count !== 'undefined') {
            count = _count;
        }

        // visible items
        var visible = 1;

        if (!itemWidth || !holderWidth) {
            return;
        }

        visible = Math.ceil(holderWidth/itemWidth) || 1;

        if (visible % 2 === 0) {    // 0 2 4 6
            visible++;              // 1 3 5 7
        }

        // addition items
        this._addition = visible;

        // check simple mode
        if (count && visible >= count) {
            this._isSimple = true;
            this._addition = 0;
        }
        else {
            this._isSimple = false;
        }

        // check previous state
        if (visible != this._visible) {
            this._visible = visible;
            this._updateVisible();
        }
    };

    return LazyCarousel;
})();

// Export
window.LazyCarousel = LazyCarousel;

})(window, document);

