import utils from 'my-utils';

/**
 *  slideToDir
 *  _attachHandlers,
 *  _detachHandlers
 */

export function KeyHandlerDecorator(base, options) {
    function KeyHandlerDecorator() {
        base.apply(this, arguments);
        this._keyHandler = this._keyHandler.bind(this);
    }
    utils.inherits(KeyHandlerDecorator, base);

    KeyHandlerDecorator.prototype._attachHandlers = function() {
        base.prototype._attachHandlers.apply(this, arguments);

        document.addEventListener('keyup', this._keyHandler, false);
    };

    KeyHandlerDecorator.prototype._detachHandlers = function() {
        base.prototype._detachHandlers.apply(this, arguments);

        document.removeEventListener('keyup', this._keyHandler, false);
    };

    KeyHandlerDecorator.prototype._keyHandler = function(event) {
        // > 39
        // < 37
        var keyCode = event.which || event.keyCode;

        if (keyCode === 39 || keyCode === 37) {
            var dir = 1;
            if (keyCode === 37) {
                dir = -1;
            }
            this.slideToDir(dir);
        }
    };

    return KeyHandlerDecorator;
}

export default function keyHandlerDecorator(options) {
    return function(inst) {
        var _attachHandlers = inst._attachHandlers.bind(inst),
            _detachHandlers = inst._detachHandlers.bind(inst);

        inst.__keyHandlerDecorator = true;
        inst._attachHandlers = function(){
            _attachHandlers();

            document.addEventListener('keyup', _keyHandler, false);
        };

        inst._detachHandlers = function(){
            _detachHandlers();

            document.removeEventListener('keyup', _keyHandler, false);
        };

        var _keyHandler = function(event){
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
    }
}

