import utils from  'my-utils';
import * as helpers from './helpers.js';
import LazyCarousel from '../src/LazyCarousel.js';
import swipeDecorator from '../src/decorators/SwipeDecorator.js';
import keyHandlerDecorator from '../src/decorators/KeyHandlerDecorator.js';

describe('MyLazyCarouselAngular', function() {
    var $compile, $rootScope, root;

    beforeEach(function() {
        root = utils.appendElement(document.body, '<div id="root" />');


        module('myLazyCarousel');
        inject(function(_$compile_, _$rootScope_){
            $compile = _$compile_;
            $rootScope = _$rootScope_;//.$new();
        });
    });

    afterEach(function() {
        //document.body.removeChild(root);
    });

    describe('controller initialization', function() {
        var $scope;

        function compileElement(str){
            var elem = utils.appendElement(root, str);
            $scope = $rootScope.$new();
            var compiledElem = $compile(elem)($scope);
            $scope.$digest();

            return compiledElem;
        }

        beforeEach(function() {
            $scope = $rootScope.$new();
        });

        it('default controller', function() {
            var elem = compileElement(
                            '<div class="lazy_carousel" ' +
                            '           my-lazy-carousel="carousel.items" ' +
                            '           my-lazy-carousel-active="carousel.active" ' +
                            '           item-as="item">' +
                            '   {{item.id}}' +
                            '</div>');

            var ctrl = elem.controller('myLazyCarousel');

            expect(ctrl instanceof LazyCarousel).toBeTruthy();
            expect(ctrl.constructor.name).toBe('MyLazyCarouselCtrl');
        });

        xit('should initialize "keyHandlerDecorator" controller', function() {
            var elem = compileElement(
                '<div class="lazy_carousel" ' +
                '           my-lazy-carousel="carousel.items" ' +
                '           my-lazy-carousel-active="carousel.active" ' +
                '           item-as="item" support-keys="true">' +
                '   {{item.id}}' +
                '</div>');

            var ctrl = elem.controller('myLazyCarousel');

            expect(ctrl instanceof LazyCarousel).toBeTruthy();
            expect(ctrl.constructor.name).toBe('KeyHandlerDecorator');
        });

        xit('should initialize "swipeDecorator" controller', function() {
            var elem = compileElement(
                '<div class="lazy_carousel" ' +
                '           my-lazy-carousel="carousel.items" ' +
                '           my-lazy-carousel-active="carousel.active" ' +
                '           item-as="item" support-swipe="true">' +
                '   {{item.id}}' +
                '</div>');

            var ctrl = elem.controller('myLazyCarousel');

            expect(ctrl instanceof LazyCarousel).toBeTruthy();
            expect(ctrl.constructor.name).toBe('SwipeDecorator');
        });
    });

});
