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
        supportTouch: true
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
            this.swipe._amplitude = this.swipe._offset = 0;
            this.swipe._velocity = 0;
            this.swipe._offsetTrack = this.swipe._offset = this._getOffset();
            this.swipe._timeStamp = Date.now();
            window.clearInterval(this.swipe._timer);
            this.swipe._timer = window.setInterval(this._track.bind(this), 100);
        }.bind(inst);

        var _touchMove = function(event){
            if (!this.swipe._isActive) {
                return;
            }

            var coords = _getEventPosition(event),
                prop = this.swipe.opts.type.toLowerCase();

            if (this.swipe._preventMove === null) {
                var swipeDir = _getSwipeDirection(this.swipe._lastPos, coords, this.swipe.opts.type);

                if (swipeDir === null) {
                    return;
                }
                else if (this.swipe.opts.type === type.x && (swipeDir === 'up' || swipeDir === 'down')) {
                    this.swipe._isActive = false;
                    return;
                }
                else if (this.swipe.opts.type === type.y && (swipeDir === 'left' || swipeDir === 'right')) {
                    this.swipe._isActive = false;
                    return;
                }
                else {
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

        var _touchEnd = function(event) {
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

                var count = Math.abs((this.swipe._offsetTarget + this.swipe._dir * this.swipe._amplitude)/this.itemSize);

                this.swipe._offsetTarget = this._getOffset() + this.swipe._amplitude;
            }

            this.swipe._targetCount = (this.swipe._offsetTarget - this._getOffset()) / this.itemSize;

            this.swipe._targetCount = Math.round(Math.abs(this.swipe._targetCount));

            if (this.swipe._targetCount > maxCount) {
                this.swipe._targetCount = maxCount;
            }

            this.swipe._offsetTarget = this._calculateOffset(this.swipe._dir * this.swipe._targetCount);

            this.swipe._amplitude = (this.swipe._offsetTarget - this.swipe._offset);

            this.swipe._timeStamp = Date.now();
            requestAnimationFrame(this._animate.bind(this));
        }.bind(inst);

        inst._track = function(event) {
            var now, elapsed, delta, v;

            now = Date.now();
            elapsed = now - this.swipe._timeStamp;
            this.swipe._timeStamp = now;
            delta = this.swipe._offset - this.swipe._offsetTrack;
            this.swipe._offsetTrack = this.swipe._offset;

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
                    this._setOffset(this.swipe._offsetTarget + delta, true);
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
            var x = startPoint.x - endPoint.x,
                y = startPoint.y - endPoint.y;

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
swipeDecorator.type = type;
