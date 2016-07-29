(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define("myLazyCarousel", ['LazyCarousel', 'swipeDecorator', 'keyHandlerDecorator', 'myLazyCarousel'], factory);
    } else if (typeof exports !== 'undefined') {
        // CommonJS
        module.exports = factory(
            require('./LazyCarousel.js'),
            require('./swipeDecorator.js'),
            require('./keyHandlerDecorator.js'),
            require('./MyLazyCarouselAngular.js')
        );
    } else {
        // Browser globals
        global._LazyCarousel = factory(
            global.LazyCarousel,
            global.swipeDecorator,
            global.keyHandlerDecorator,
            global.myLazyCarouselModule
        );
    }
})(this, function (LazyCarousel, swipeDecorator, keyHandlerDecorator, myLazyCarouselModule) {

'use strict';

// Import

// Export
return {
    LazyCarousel: LazyCarousel,
    swipeDecorator: swipeDecorator,
    SwipeDecorator: swipeDecorator.SwipeDecorator,
    keyHandlerDecorator: keyHandlerDecorator,
    KeyHandlerDecorator: keyHandlerDecorator.KeyHandlerDecorator,
    myLazyCarouselModule: myLazyCarouselModule
};

});
