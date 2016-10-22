import utils from 'my-utils';

/**
 *  slideToDir
 *  _attachHandlers,
 *  _detachHandlers
 */

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

