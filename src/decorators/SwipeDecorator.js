import utils from 'my-utils';

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

export default function swipeDecorator(options) {
    var defOpts = {
        type: type.x,
        supportMouse: false,
        supportTouch: true,
        deceleration: 0.0006,
        nextSlideRatio: 0.15,
        speedRatio: 1,
        animateMinPx: 3
    };

    return function swipeDecoratorFn(inst) {
        var _attachHandlers = inst._attachHandlers.bind(inst),
            _detachHandlers = inst._detachHandlers.bind(inst);

        var opts = utils.extend({}, defOpts);
        opts = utils.extend(opts, options);

        inst.__swipeDecorator = true;

        // swipe options
        inst.swipe = {};
        inst.swipe.opts = opts;

        inst.swipe._isActive = false;
        inst.swipe._preventSwipe = null;

        inst.swipe._dir = 1;
        inst.swipe._offset = 0;
        inst.swipe._offsetTarget = 0;
        inst.swipe._amplitude = 0;
        inst.swipe._targetCount = 0;

        inst.swipe._initPos = {};

        inst.swipe._startPos = {};
        inst.swipe._startTime = 0;

        inst.swipe._endTime = 0;

        inst.swipe._animateTime = 0;

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
			this.swipe._preventSwipe = null;
            this.swipe._initPos = _getEventPosition(event);
			this.swipe._offset = this._getOffset();
            this.swipe._amplitude = 0;

            this.swipe._startPos = this.swipe._initPos;
            inst.swipe._startTime = Date.now();
        }.bind(inst);

        var _touchMove = function(event){
            if (!this.swipe._isActive) {
                return;
            }

            var coords = _getEventPosition(event),
                prop = this.swipe.opts.type.toLowerCase(),
                timestamp,
                offset;

            if (this.swipe._preventSwipe === null) {
                var swipeDir = _getSwipeDirection(this.swipe._initPos, coords, this.swipe.opts.type);

                if (swipeDir === null) {
                    return;
                }
                else if (this.swipe.opts.type === type.x && (swipeDir === 'up' || swipeDir === 'down')) {
                    this.swipe._isActive = false;
					this.swipe._preventSwipe = true;
                    return;
                }
                else if (this.swipe.opts.type === type.y && (swipeDir === 'left' || swipeDir === 'right')) {
                    this.swipe._isActive = false;
					this.swipe._preventSwipe = true;
                    return;
                }
                else {
                    this.swipe._preventSwipe = false;
                }
            }
            event.preventDefault();
            event.stopPropagation();

            offset = this._getOffset() + coords[prop] - this.swipe._initPos[prop];
            this._setOffset(offset, true);
            this.swipe._offset = offset;

            timestamp = Date.now();
            if ( timestamp - this.swipe._startTime > 300 ) {
                this.swipe._startTime = timestamp;
                this.swipe._startPos = coords;
            }
        }.bind(inst);

        var _touchEnd = function(event) {
            if (!this.swipe._isActive) {
                return;
            }

			if (this.swipe._preventSwipe === null || this.swipe._preventSwipe === true) {
				this.swipe._isActive = false;
				this.swipe._preventSwipe = null;
				this._isBusy = false;
				return;
			}
			
            var coords = _getEventPosition(event),
                prop = this.swipe.opts.type.toLowerCase();

            this.swipe._isActive = false;
            this.swipe._preventSwipe = null;

            this.swipe._dir = 1;
            if (coords[prop] > this.swipe._initPos[prop]) {
                this.swipe._dir = -1;
            }

            // magic ))
            this.__calculateSwipeCount(coords);

            this.swipe._offsetTarget = this._calculateOffset(this.swipe._dir * this.swipe._targetCount);

            this.swipe._amplitude = this.swipe._offsetTarget - this.swipe._offset;

            this.swipe._endTime = Date.now();
            requestAnimationFrame(this.__animate.bind(this));
        }.bind(inst);

        inst.__calculateSwipeCount = function (coords) {
            var prop = this.swipe.opts.type.toLowerCase(),
                maxCount = this._getMaxSlideCount(this.swipe._dir),
                timestamp = Date.now(),
                duration = timestamp - this.swipe._startTime,
                amplitude,
                speed;

            if ( duration < 300 ) {
                amplitude = _getSwipeAmplitude(coords[prop], this.swipe._startPos[prop], duration, inst.swipe.opts.deceleration);
            }
            else {
                amplitude = Math.abs(coords[prop] - this.swipe._initPos[prop]);
            }

            speed = amplitude / duration;
            this.swipe._animateTime = amplitude / speed;

            this.swipe._targetCount = (amplitude * - this.swipe._dir) / this.itemSize;

            if (Math.abs(this.swipe._targetCount) < 1) {
                if ((Math.abs(this.swipe._targetCount) - Math.floor(Math.abs(this.swipe._targetCount)) < inst.swipe.opts.nextSlideRatio )) {
                    this.swipe._targetCount = 0;
                }
                else {
                    this.swipe._targetCount = 1;
                }
            }
            else {
                this.swipe._targetCount = Math.round(Math.abs(this.swipe._targetCount));
            }

            if (this.swipe._targetCount > maxCount) {
                this.swipe._targetCount = maxCount;
            }

            return this.swipe._targetCount;
        }.bind(inst);

        inst.__animate = function() {
            var now, elapsed, delta;

            var min = this.swipe.opts.animateMinPx;

            if (this.swipe._amplitude) {
                now = Date.now();
                elapsed = now - this.swipe._endTime;
                delta = - this.swipe._amplitude * Math.exp(- elapsed / (this.swipe._animateTime * this.swipe.opts.speedRatio));
                if (delta > min || delta < - min) {
                    this._setOffset(this.swipe._offsetTarget + delta, true);
                    requestAnimationFrame(this.__animate.bind(this));
                    this._isBusy = true;
                }
                else {
                    this._isBusy = false;
                    this._setOffset(this.swipe._offsetTarget, true);
                    this.slideToDir(this.swipe._dir, this.swipe._targetCount, true);
                }
            }
        }.bind(inst);

        function _getEventPosition(event) {
            var originalEvent = event.originalEvent || event;
            var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
            var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

            return {
                x: e.clientX,
                y: e.clientY
            };
        }

        function _getSwipeDirection(startPoint, endPoint) {
            var x = startPoint.x - endPoint.x,
                y = startPoint.y - endPoint.y;

            var xAbs = Math.abs(x),
                yAbs = Math.abs(y);

            if (xAbs < 20 && yAbs < 20){
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
        }

        function _getSwipeAmplitude(current, start, time, deceleration) {
            var distance = current - start,
                speed = Math.abs(distance) / time;

            return Math.abs(distance) + (( speed * speed ) / ( 2 * deceleration ));

        }

        //return SwipeDecorator(inst, options);
        return inst;
    }
}
swipeDecorator.type = type;
