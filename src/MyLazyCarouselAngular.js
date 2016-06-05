(function(window, document, undefined){
'use strict';

// Import
var angular = window.angular;
var utils = window.utils;
var LazyCarousel = window.LazyCarousel;

var myLazyCarouselModule = angular.module('myLazyCarousel', []);

// Controller
var MyLazyCarouselCtrl = (function() {
    var $timeout;

    function MyLazyCarouselCtrl($scope, _$timeout_) {
        $timeout = _$timeout_;
        this.$scope = $scope;
        this._itemScopeAs = 'item';

        LazyCarousel.call(this, null, {
            noInit: true,
            trackById: '_id'
        });
    }
    MyLazyCarouselCtrl.$inject = ['$scope', '$timeout'];
    utils.inherits(MyLazyCarouselCtrl, LazyCarousel);

    MyLazyCarouselCtrl.prototype.init = function(elem, _transclude){
        this._transclude = _transclude;

        LazyCarousel.prototype.init.call(this, elem);
    };

    MyLazyCarouselCtrl.prototype._transclude = function($scope, callback){
        callback = callback || function(){};
        callback(false);
    };
    MyLazyCarouselCtrl.prototype._addItemPost = function(item, $item) {
        // compile

        var itemAs = this.$scope.itemAs || this._itemScopeAs;

        var childScope = this.$scope.$parent.$new();

        var self = this;
        this._transclude(childScope, function(elem, $scope){
            $scope[itemAs] = item;

            $scope.$carousel = self.$scope;
            $scope.$isActive = false;
            $scope.$isShowed = false;

            $scope.$watch('$carousel.active._id', function (newActiveId) {
                $scope.$isActive = (newActiveId == item._id) ? true : false;
            });

            angular.element($item).append(elem);

            $timeout(function(){
                $scope.$digest();
            });

            $timeout(function(){
                $scope.$isShowed = true;
            }, 500);
        });
    };
    MyLazyCarouselCtrl.prototype._removeItemPre = function(item, $item, callback) {
        // destroy
        var $scope = angular.element($item).children().scope();
        $scope.$destroy();

        callback();
    };
    MyLazyCarouselCtrl.prototype._getItemTemplate = function(item) {
        return '<li class="lc-item" data-id="'+ item._id +'"></li>';
    };

    return MyLazyCarouselCtrl;
})();

// Directive
function MyLazyCarouselDirective($timeout) {
    var iid = 1;

    return {
        restrict: 'EA',
        transclude: true,
        scope: {
            items: '=myLazyCarousel',
            itemAs: '@itemAs',
            active: '=myLazyCarouselActive'
        },
        template:   '<div class="lc-list_holder">' +
                    '   <ul class="lc-list"></ul>' +
                    '</div>' +
                    '<div class="lc-nav">' +
                    '   <a href="#" ng-click="goTo($event, -1)" class="lc-nav_link prev" data-dir="-1">Prev</a>' +
                    '   <a href="#" ng-click="goTo($event, 1)" class="lc-nav_link next" data-dir="1">Next</a>' +
                    '</div>',
        controller: 'myLazyCarouselCtrl',
        compile: function(tElement, tAttrs) {

            return function ($scope, element, attrs, ctrl, transclude) {
                $scope._iid = iid++;

                ctrl.init(element[0], transclude);

                $scope.nav = {
                    prev: false,
                    next: false
                };

                $scope.goTo = function ($event, dir) {
                    $event.preventDefault();
                    ctrl.slideTo(parseInt(dir, 10));
                };

                $scope.setActive = function ($event, item) {
                    if ($event) {
                        $event.preventDefault();
                    }
                    $scope.active = item;
                };

                $scope.$watch('items', function (newList) {
                    ctrl.updateItems(newList || [], $scope.active ? $scope.active._id : undefined);
                });

                $scope.$watch('active', function (newActive) {
                    if (newActive) {
                        ctrl.slideToId(newActive._id);
                    }
                });

                $scope.$on('$destroy', ctrl.destroy.bind(ctrl));

                ctrl.$events.on('activeChange', function (item) {
                    if ($scope.active && item && $scope.active._id == item._id) {
                        return;
                    }

                    $timeout(function () {
                        $scope.active = item;
                    });
                });

                ctrl.$events.on('navChange', function (nav) {
                    $timeout(function () {
                        $scope.nav.prev = nav.prev;
                        $scope.nav.next = nav.next;
                    });
                });
            };

        }
    };
}
MyLazyCarouselDirective.$inject = ['$timeout'];


myLazyCarouselModule.directive('myLazyCarousel', MyLazyCarouselDirective);
myLazyCarouselModule.controller('myLazyCarouselCtrl', MyLazyCarouselCtrl);

// Export
window.myLazyCarousel = myLazyCarouselModule;

})(window, document);

