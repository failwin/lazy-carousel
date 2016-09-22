import utils from  'my-utils';
import angular from 'angular';
import angularMocks from 'angular-mocks';

import * as helpers from './helpers.js';

import MyLazyCarouselAngular from '../src/MyLazyCarouselAngular.js';
import LazyCarousel from '../src/LazyCarousel.js';
import swipeDecorator from '../src/decorators/SwipeDecorator.js';
import keyHandlerDecorator from '../src/decorators/KeyHandlerDecorator.js';

var module = angular.mock.module,
    inject = angular.mock.inject,
    dump = angular.mock.dump;

describe('MyLazyCarouselAngular', function() {
    var root, $compile, $rootScope, $controller, $controllerProvider, $injector;

    function compileElement(str, _$scope){
        var elem = utils.appendElement(root, str);
        var $scope = _$scope ? _$scope : $rootScope.$new();
        var compiledElem = $compile(elem)($scope);

        //$scope.$digest();

        var ctrl = compiledElem.controller('myLazyCarousel');

        return {
            elem: compiledElem,
            $scope: $scope,
            ctrl: ctrl
        };
    }

    function getFakeItems(items, _uniqueKeyProp) {
        var res,
            obj,
            key = _uniqueKeyProp || 'id';

        if (utils.isArray(items)) {
            res = items.map(function(id) {
                obj = {};
                obj[key] = id;
                return obj;
            });
        }
        else {
            res = [];
            for (var i = 0; i < items; i++) {
                obj = {};
                obj[key] = i;
                res.push(obj);
            }
        }
        return res;
    }

    beforeEach(function() {
        root = utils.appendElement(document.body, '<div id="root" />');

        module('myLazyCarousel');
        module(function(_$controllerProvider_){
            $controllerProvider = _$controllerProvider_;
        });
        inject(function(_$compile_, _$rootScope_, _$controller_, _$injector_){
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $injector = _$injector_;
            $controller = _$controller_;
        });
    });

    afterEach(function() {
        document.body.removeChild(root);
    });

    describe('base', function() {
        it('should define "myLazyCarousel" directive', function() {
            expect($injector.has('myLazyCarouselDirective')).toBe(true);
        });

        it('should define "myLazyCarouselCtrl" controller', function() {
            expect($controllerProvider.has('myLazyCarouselCtrl')).toBe(true);
        });
    });

    describe('initialization', function() {
        let $scope;

        beforeEach(function() {
            $scope = $rootScope.$new();

            $scope.carousel = {
                items: getFakeItems(1)
            };
        });

        it('should be defined', function() {
            let { elem, ctrl, $scope } = compileElement(`
                <div class="lazy_carousel"
                    my-lazy-carousel="carousel.items"
                    item-as="item"
                >
                    {{item.id}}
                </div>
            `.trim());

            expect(elem).toBeDefined();
            expect(ctrl).toBeDefined();
            expect($scope).toBeDefined();
        });

        it('should call myLazyCarouselReady callback and past "$carousel" instance there', function() {
            let inst;
            $scope.carouselReady = function(_inst){
                inst = _inst;
            };

            let { elem, ctrl } = compileElement(`
                <div class="lazy_carousel"
                    my-lazy-carousel="carousel.items"
                    my-lazy-carousel-on-ready="carouselReady($carousel)"
                    item-as="item"
                >
                    <div class="carousel_item">{{item.id}}</div>
                </div>
            `.trim(), $scope);

            $scope.$digest();

            expect(inst).toBeDefined();
        });

        it('should define "$carousel" reference for each item', function() {
            let { elem, ctrl } = compileElement(`
                <div class="lazy_carousel"
                    my-lazy-carousel="carousel.items"
                    item-as="item"
                >
                    <span class="carousel_item">
                        {{item.id}}
                    </span>
                </div>
            `.trim(), $scope);

            $scope.$digest();

            let itemScope = elem.find('span').eq(0).scope();

            expect(itemScope).toBeDefined();
            expect(itemScope.$carousel).toBeDefined();
        });

        it('should define "$carousel.activeId" value active item', function() {
            $scope.carousel = {
                items: getFakeItems(3)
            };

            let { elem, ctrl } = compileElement(`
                <div class="lazy_carousel"
                    my-lazy-carousel="carousel.items"
                    item-as="item"
                >
                    <span class="carousel_item" ng-class="{active: $carousel.activeId == item.id}">
                        {{item.id}}
                    </span>
                </div>
            `.trim(), $scope);

            $scope.$digest();

            let items = elem.find('span');

            let scope1 = items.eq(0).scope();
            let scope2 = items.eq(1).scope();
            let scope3 = items.eq(2).scope();

            expect(scope1.$carousel.activeId).toBe(0);
            expect(scope2.$carousel.activeId).toBe(0);
            expect(scope3.$carousel.activeId).toBe(0);

            expect(items.eq(0).hasClass('active')).toBe(false);
            expect(items.eq(1).hasClass('active')).toBe(true);
        });

        it('should render empty list', function() {
            let { elem, ctrl, $scope } = compileElement(`
                <div class="lazy_carousel"
                    my-lazy-carousel="carousel.items"
                    item-as="item"
                >
                    <div class="carousel_item">{{item.id}}</div>
                </div>
            `.trim(), $scope);

            $scope.$digest();

            let $items = elem[0].querySelectorAll('.carousel_item');

            expect($items.length).toBe(0);
        });

        it('should fill list with appropriate items', function() {
            let { elem, ctrl } = compileElement(`
                <div class="lazy_carousel"
                    my-lazy-carousel="carousel.items"
                    item-as="item"
                >
                    <div class="carousel_item">{{item.id}}</div>
                </div>
            `.trim(), $scope);

            $scope.$digest();

            let $items = elem[0].querySelectorAll('.carousel_item');

            expect($items.length).toBe(1);
        });

        it('should call "myLazyCarouselOnActiveChange" after active change', function() {
            var log = [];

            $scope.carousel = {
                items: getFakeItems(3)
            };
            $scope.activeChange = function(index, id){
                log.push(index);
                log.push(id);
            };

            let { elem, ctrl } = compileElement(`
                <div class="lazy_carousel"
                    my-lazy-carousel="carousel.items"
                    my-lazy-carousel-on-active-change="activeChange(index, id)"
                    item-as="item"
                >
                    {{item.id}}
                </div>
            `.trim(), $scope);

            $scope.$digest();

            expect(log).toEqual([0, 0]);
        });
    });

});
