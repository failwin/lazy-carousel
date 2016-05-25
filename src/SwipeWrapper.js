(function(window, document, undefined){
'use strict';

// Import
var utils = window.utils;

var SwipeWrapper = (function() {
    // Swipe wrapper
    function SwipeWrapper($elem, opts) {
        this.opts = utils.extend({}, this.defOpts);
        this.opts = utils.extend(this.opts, opts);

        this.$list = $elem;
        this.parent = this.opts.parent;

        // swipe options
        this._isActive = false;
        this._lastPos = {};
        this._timer = null;
        this._timeStamp = 0;
        this._velocity = 0;
        this._amplitude = 0;
        this._offsetLeft = 0;
        this._offsetLeftTrack = 0;
        this._offsetLeftTarget = 0;
        this._targetIndex = 0;
        this._weight = 0.5;

        this._targetCount = 0;
        this._dir = 1;

        if (!this.opts.noInit) {
            this.init();
        }
    }
    SwipeWrapper.prototype.defOpts = {
        noInit: false,
        supportMouse: true,
        supportTouch: true,
        parent: {
            _isBusy: false,
            _itemWidth: 0,
            _offsetLeft: 0,
            _setOffset: function(offsetLeft) {

            },
            _getMaxSlideCount: function(dir) {

            },
            _getOffsetLeft: function(index, isDir) {

            },
            slideTo: function(dir, count, fast) {

            }
        }
    };

    SwipeWrapper.prototype.init = function() {

        this._attachHandlers();
    };

    SwipeWrapper.prototype.destroy = function() {
        this._detachHandlers();
    };

    SwipeWrapper.prototype._attachHandlers = function() {
        // List focus/blur

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
    SwipeWrapper.prototype._detachHandlers = function() {
        // List focus/blur
        this.$list.removeEventListener('mouseleave', this, false);

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

    SwipeWrapper.prototype.handleEvent = function(event) {
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

    SwipeWrapper.prototype._touchStart = function(event){
        if (this.parent._isBusy) {
            return;
        }

        this._isActive = true;
        this._lastPos = this._getEventPosition(event);
        this._amplitude = this._offsetLeft = 0;
        this._velocity = 0;
        this._offsetLeftTrack = this._offsetLeft = this.parent._offsetLeft;
        this._timeStamp = Date.now();
        window.clearInterval(this._timer);
        this._timer = window.setInterval(this._track.bind(this), 100);
    };
    SwipeWrapper.prototype._touchMove = function(event){
        if (!this._isActive) {
            return;
        }

        var coords = this._getEventPosition(event);
        var deltaX = coords.x - this._lastPos.x;

        var swipeDir = this._getSwipeDirection(this._lastPos, coords);
        if (swipeDir == 'left' || swipeDir == 'right') {
            event.preventDefault();
            event.stopPropagation();
        }

        var offsetLeft = this.parent._offsetLeft + deltaX;
        this.parent._setOffset(offsetLeft);
        this._offsetLeft = offsetLeft;
    };
    SwipeWrapper.prototype._touchEnd = function(event) {
        if (!this._isActive) {
            return;
        }

        this._isActive = false;
        window.clearInterval(this._timer);

        this._offsetLeftTarget = this._offsetLeft;
        this._targetCount = 0;

        var coords = this._getEventPosition(event);

        this._dir = 1;
        if (coords.x > this._lastPos.x) {
            this._dir = -1;
        }

        var maxCount = this.parent._getMaxSlideCount(this._dir);

        if (this._velocity > 100 || this._velocity < -100) {

            this._amplitude = this._weight * this._velocity;

            var count = Math.abs((this._offsetLeftTarget + this._dir * this._amplitude)/this.parent._itemWidth);

            this._offsetLeftTarget = this.parent._offsetLeft + this._amplitude;
        }

        this._targetCount = (this._offsetLeftTarget - this.parent._offsetLeft) / this.parent._itemWidth;

        this._targetCount = Math.round(Math.abs(this._targetCount));

        if (this._targetCount > maxCount) {
            this._targetCount = maxCount;
        }

        this._offsetLeftTarget = this.parent._getOffsetLeft(this._dir * this._targetCount, true);

        this._amplitude = (this._offsetLeftTarget - this._offsetLeft);

        this._timeStamp = Date.now();
        requestAnimationFrame(this._animate.bind(this));
    };

    SwipeWrapper.prototype._track = function(event) {
        var now, elapsed, delta, v;

        now = Date.now();
        elapsed = now - this._timeStamp;
        this._timeStamp = now;
        delta = this._offsetLeft - this._offsetLeftTrack;
        this._offsetLeftTrack = this._offsetLeft;

        v = 1000 * delta / (1 + elapsed);
        this._velocity = 0.8 * v + 0.2 * this._velocity;
    };
    SwipeWrapper.prototype._animate = function() {
        var now, elapsed, delta;

        if (this._amplitude) {
            now = Date.now();
            elapsed = now - this._timeStamp;
            delta = - this._amplitude * Math.exp(- elapsed / 325);
            if (delta > 8 || delta < -8) {
                this.parent._setOffset(this._offsetLeftTarget + delta);
                requestAnimationFrame(this._animate.bind(this));
                this.parent._isBusy = true;
            }
            else {
                this.parent._isBusy = false;
                this.parent.slideTo(this._dir, this._targetCount, true);
            }
        }
    };

    SwipeWrapper.prototype._getEventPosition = function(event) {
        var originalEvent = event.originalEvent || event;
        var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
        var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

        return {
            x: e.clientX,
            y: e.clientY
        };
    };
    SwipeWrapper.prototype._getSwipeAngle = function(startPoint, endPoint) {
        var x = startPoint.x - endPoint.x;
        var y = startPoint.y - endPoint.y;
        var r = Math.atan(y, x);
        var angle = Math.round(r * 180 / Math.PI);

        if (angle < 0) {
            angle = 360 - Math.abs(angle);
        }

        return angle;
    };
    SwipeWrapper.prototype._getSwipeDirection = function(startPoint, endPoint) {
        var angle = this._getSwipeAngle(startPoint, endPoint);

        if ((angle <= 45) && (angle >= 0)) {
            return 'left';
        }
        else if ((angle <= 360) && (angle >= 315)) {
            return 'left';
        }
        else if ((angle >= 135) && (angle <= 225)) {
            return 'right';
        }
        else if ((angle > 45) && (angle < 135)) {
            return 'down';
        }
        else {
            return 'up';
        }
    };

    return SwipeWrapper;
})();

// Export
window.SwipeWrapper = SwipeWrapper;

})(window, document);

