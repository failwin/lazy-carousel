import utils from 'my-utils';

/**
 *  $list
 *  itemWidth
 *
 *  slideToDir
 *  handleEvent
 *  _getOffset
 *  _setOffset
 *  _calculateOffset
 *  _getMaxSlideCount
 *  _attachHandlers,
 *  _detachHandlers
 */

export function SwipeDecorator(base, options) {
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
    }
    utils.inherits(SwipeDecorator, base);

    SwipeDecorator.prototype.defOpts = utils.extend({
        supportMouse: false,
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

        if (this.opts.supportTouch) {
            // Touch
            this.$list.removeEventListener('touchstart', this, false);
            this.$list.removeEventListener('touchmove', this, false);
            this.$list.removeEventListener('touchend', this, false);
            this.$list.removeEventListener('touchcancel', this, false);
        }

        if (this.opts.supportMouse) {
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
        this.swipe._offsetLeftTrack = this.swipe._offsetLeft = this._getOffset();
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
            else if (swipeDir === 'up' || swipeDir === 'down') {
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

        var offsetLeft = this._getOffset() + deltaX;
        this._setOffset(offsetLeft, true);
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

            var count = Math.abs((this.swipe._offsetLeftTarget + this.swipe._dir * this.swipe._amplitude)/this.itemWidth);

            this.swipe._offsetLeftTarget = this._getOffset() + this.swipe._amplitude;
        }

        this.swipe._targetCount = (this.swipe._offsetLeftTarget - this._getOffset()) / this.itemWidth;

        this.swipe._targetCount = Math.round(Math.abs(this.swipe._targetCount));

        if (this.swipe._targetCount > maxCount) {
            this.swipe._targetCount = maxCount;
        }

        this.swipe._offsetLeftTarget = this._calculateOffset(this.swipe._dir * this.swipe._targetCount);

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
            if (delta > 5 || delta < -5) {
                this._setOffset(this.swipe._offsetLeftTarget + delta, true);
                requestAnimationFrame(this._animate.bind(this));
                this._isBusy = true;
            }
            else {
                this._isBusy = false;
                this.slideToDir(this.swipe._dir, this.swipe._targetCount, true);
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
}

export default function swipeDecorator(options) {
    var defOpts = {
        supportMouse: false,
        supportTouch: true
    };

    return function(inst) {
        var _attachHandlers = inst._attachHandlers.bind(inst),
            _detachHandlers = inst._detachHandlers.bind(inst);

        var opts = utils.extend({}, defOpts);
        opts = utils.extend(opts, options);

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
        inst.swipe._offsetLeft = 0;
        inst.swipe._offsetLeftTrack = 0;
        inst.swipe._offsetLeftTarget = 0;
        inst.swipe._weight = 0.99;

        inst.swipe._targetCount = 0;
        inst.swipe._dir = 1;

        inst._attachHandlers = function(){
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

        inst._detachHandlers = function(){
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

        var _touchStart = function(event){
            if (this._isBusy) {
                return;
            }

            this.swipe._isActive = true;
            this.swipe._lastPos = _getEventPosition(event);
            this.swipe._amplitude = this.swipe._offsetLeft = 0;
            this.swipe._velocity = 0;
            this.swipe._offsetLeftTrack = this.swipe._offsetLeft = this._getOffset();
            this.swipe._timeStamp = Date.now();
            window.clearInterval(this.swipe._timer);
            this.swipe._timer = window.setInterval(this._track.bind(this), 100);
        }.bind(inst);

        var _touchMove = function(event){
            if (!this.swipe._isActive) {
                return;
            }

            var coords = _getEventPosition(event);

            if (this.swipe._preventMove === null) {
                var swipeDir = _getSwipeDirection(this.swipe._lastPos, coords);
                if (swipeDir === null) {
                    return;
                }
                else if (swipeDir === 'up' || swipeDir === 'down') {
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

            var offsetLeft = this._getOffset() + deltaX;
            this._setOffset(offsetLeft, true);
            this.swipe._offsetLeft = offsetLeft;
        }.bind(inst);

        var _touchEnd = function(event) {
            if (!this.swipe._isActive) {
                return;
            }

            this.swipe._isActive = false;
            this.swipe._preventMove = null;
            window.clearInterval(this.swipe._timer);

            this.swipe._offsetLeftTarget = this.swipe._offsetLeft;
            this.swipe._targetCount = 0;

            var coords = _getEventPosition(event);

            this.swipe._dir = 1;
            if (coords.x > this.swipe._lastPos.x) {
                this.swipe._dir = -1;
            }

            var maxCount = this._getMaxSlideCount(this.swipe._dir);

            if (this.swipe._velocity > 100 || this.swipe._velocity < -100) {

                this.swipe._amplitude = this.swipe._weight * this.swipe._velocity;

                var count = Math.abs((this.swipe._offsetLeftTarget + this.swipe._dir * this.swipe._amplitude)/this.itemWidth);

                this.swipe._offsetLeftTarget = this._getOffset() + this.swipe._amplitude;
            }

            this.swipe._targetCount = (this.swipe._offsetLeftTarget - this._getOffset()) / this.itemWidth;

            this.swipe._targetCount = Math.round(Math.abs(this.swipe._targetCount));

            if (this.swipe._targetCount > maxCount) {
                this.swipe._targetCount = maxCount;
            }

            this.swipe._offsetLeftTarget = this._calculateOffset(this.swipe._dir * this.swipe._targetCount);

            this.swipe._amplitude = (this.swipe._offsetLeftTarget - this.swipe._offsetLeft);

            this.swipe._timeStamp = Date.now();
            requestAnimationFrame(this._animate.bind(this));
        }.bind(inst);

        inst._track = function(event) {
            var now, elapsed, delta, v;

            now = Date.now();
            elapsed = now - this.swipe._timeStamp;
            this.swipe._timeStamp = now;
            delta = this.swipe._offsetLeft - this.swipe._offsetLeftTrack;
            this.swipe._offsetLeftTrack = this.swipe._offsetLeft;

            v = 1000 * delta / (1 + elapsed);
            this.swipe._velocity = 0.8 * v + 0.2 * this.swipe._velocity;
        }.bind(inst);
        inst._animate = function() {
            var now, elapsed, delta;

            if (this.swipe._amplitude) {
                now = Date.now();
                elapsed = now - this.swipe._timeStamp;
                delta = - this.swipe._amplitude * Math.exp(- elapsed / 325);
                if (delta > 5 || delta < -5) {
                    this._setOffset(this.swipe._offsetLeftTarget + delta, true);
                    requestAnimationFrame(this._animate.bind(this));
                    this._isBusy = true;
                }
                else {
                    this._isBusy = false;
                    this.slideToDir(this.swipe._dir, this.swipe._targetCount, true);
                }
            }
        }.bind(inst);

        var _getEventPosition = function(event) {
            var originalEvent = event.originalEvent || event;
            var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
            var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

            return {
                x: e.clientX,
                y: e.clientY
            };
        };

        var _getSwipeDirection = function(startPoint, endPoint) {
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

        //return SwipeDecorator(inst, options);
        return inst;
    }
}