import angular from 'angular';
import utils from 'my-utils';
import LazyCarousel from './LazyCarousel.js';

import swipeDecorator from './decorators/SwipeDecorator.js';
import keyHandlerDecorator from './decorators/KeyHandlerDecorator.js';

var myLazyCarouselModule = angular.module('myLazyCarousel', []);

// Controller
var MyLazyCarouselCtrl = (function() {
    //var LazyCarousel = keyHandlerDecorator()(swipeDecorator()(LazyCarousel_));

    function MyLazyCarouselCtrl($scope, $timeout) {
        this.$scope = $scope;
        this.$timeout = $timeout;

        this._itemScopeAs = 'item';

        LazyCarousel.call(this, null, {
            noInit: true,
            changesTrackerOpts: {
                trackById: '_id',
                trackByIdFn: function(key, value, index, trackById) {
                    return value[trackById];
                }
            }
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

            angular.element($item).append(elem);
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
    return {
        restrict: 'EA',
        transclude: true,
        scope: {
            items: '=myLazyCarousel',
            itemAs: '@itemAs',
            initActive: '@myLazyCarouselActive',
            onReady: '&myLazyCarouselOnReady',
            onActiveChange: '&myLazyCarouselOnActiveChange'
        },
        template:   '<div class="lc-list_holder">' +
                    '   <ul class="lc-list"></ul>' +
                    '</div>',
        controller: 'myLazyCarouselCtrl',
        compile: function(tElement, tAttrs) {

            return function ($scope, element, attrs, ctrl, transclude) {
                ctrl.init(element[0], transclude);

                $scope.activeIndex = parseInt($scope.initActive, 10) || 0;
                $scope.activeId = null;
                $scope.nav = {
                    prev: false,
                    next: false
                };

                $scope.slideToDir = function (dir, _count, _fast) {
                    ctrl.slideToDir(dir, _count, _fast);
                };

                $scope.slideToIndex = function (index) {
                    ctrl.slideToIndex(index);
                };

                $scope.$watch('items', function (newList) {
                    ctrl.updateItems(newList || [], $scope.activeIndex);
                });

                $scope.$on('$destroy', ctrl.destroy.bind(ctrl));

                ctrl.$events.on('activeChange', function (data) {
                    $scope.$evalAsync(function(){
                        $scope.activeIndex = data.index;
                        $scope.activeId = data.id;

                        $scope.onActiveChange({
                            index: $scope.activeIndex,
                            id: $scope.activeId
                        });
                    });
                });

                ctrl.$events.on('navChange', function (nav) {
                    $scope.$evalAsync(function(){
                        $scope.nav.prev = nav.prev;
                        $scope.nav.next = nav.next;
                    });
                });

                $scope.onReady({
                    $carousel: $scope
                });
            };

        }
    };
}
MyLazyCarouselDirective.$inject = ['$timeout'];


myLazyCarouselModule.directive('myLazyCarousel', MyLazyCarouselDirective);
myLazyCarouselModule.controller('myLazyCarouselCtrl', MyLazyCarouselCtrl);

// Export
export default myLazyCarouselModule;
