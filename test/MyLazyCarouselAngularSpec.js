var utils = window.utils;

describe('MyLazyCarouselAngular', function() {
    var $compile, $rootScope;

    beforeEach(function() {
        module('myLazyCarousel');
        inject(function(_$compile_, _$rootScope_){
            $compile = _$compile_;
            $rootScope = _$rootScope_;//.$new();
        });
    });
    afterEach(function() {

    });

    it('should be defined', function() {

    });
});
