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

