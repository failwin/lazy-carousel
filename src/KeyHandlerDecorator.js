(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define("KeyHandlerDecorator", ['exports', 'utils'], factory);
    } else if (typeof exports !== 'undefined') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        var mod = {
            exports: {}
        };
        factory(mod.exports,
            window.utils
        );
        global.keyHandlerDecorator = mod.exports;
    }
})(this, function (exports, utils) {

'use strict';

// Import

var KeyHandlerDecorator = function(base, options) {
    function KeyHandlerDecorator() {
        base.apply(this, arguments);
    };
    utils.inherits(KeyHandlerDecorator, base);

    KeyHandlerDecorator.prototype._attachHandlers = function() {
        base.prototype._attachHandlers.apply(this, arguments);

        document.addEventListener('keyup', this._keyHandler.bind(this), false);
    };

    KeyHandlerDecorator.prototype._detachHandlers = function() {
        base.prototype._detachHandlers.apply(this, arguments);

        document.removeEventListener('keyup', this._keyHandler.bind(this), false);
    };

    KeyHandlerDecorator.prototype._keyHandler = function(event) {
        // > 39
        // < 37

        var keyCode = event.which || event.keyCode;

        if (keyCode == 39 || keyCode == 37) {
            var dir = 1;
            if (keyCode == 37) {
                dir = -1;
            }
            this.slideTo(dir);
        }
    };

    return KeyHandlerDecorator;
};

function keyHandlerDecorator(options) {
    return function(target) {
        return KeyHandlerDecorator(target, options);
    }
}

// Export
exports.keyHandlerDecorator = keyHandlerDecorator;
exports.KeyHandlerDecorator = KeyHandlerDecorator;

});

