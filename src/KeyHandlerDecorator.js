(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define("keyHandlerDecorator", ['my-utils'], factory);
    } else if (typeof exports !== 'undefined') {
        // CommonJS
        module.exports = factory(require('my-utils'));
    } else {
        // Browser globals
        global.keyHandlerDecorator = factory(global.utils);
    }
})(this, function (utils) {

'use strict';

// Import

var KeyHandlerDecorator = function(base, options) {
    function KeyHandlerDecorator() {
        base.apply(this, arguments);
        this.allowKeyHandlerDecorator = true;
    }
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
        if (!this.allowKeyHandlerDecorator) {
            return;
        }
        var keyCode = event.which || event.keyCode;

        if (keyCode == 39 || keyCode == 37) {
            var dir = 1;
            if (keyCode == 37) {
                dir = -1;
            }
            this.slideTo(dir);
        }
    };

    KeyHandlerDecorator.prototype.disableKeyHandlerDecorator = function() {
        this.allowKeyHandlerDecorator = false;
    };

    return KeyHandlerDecorator;
};

function keyHandlerDecorator(options) {
    return function(target) {
        return KeyHandlerDecorator(target, options);
    }
}

// Export
keyHandlerDecorator.KeyHandlerDecorator = KeyHandlerDecorator;
return keyHandlerDecorator;

});

