(function(window, document, undefined){
'use strict';

// Import
var angular = window.angular;
var utils = window.utils;
var LazyCarousel = window.LazyCarousel;

var demo = angular.module('demo', ['myLazyCarousel']);

// Controller
var demoCtrl = (function() {

    function demoCtrl($scope, $timeout) {

        $scope.carousel = {};

        $scope.carousel.items = [
            {id: 1},
            {id: 2},
            {id: 3},
            {id: 4},
            {id: 5},
            {id: 6},
            {id: 7},
            {id: 8},
            {id: 9},
            {id: 10},
            {id: 11},
            {id: 12},
            {id: 13},
            {id: 14},
            {id: 15},
            {id: 16},
            {id: 17},
            {id: 18},
            {id: 19},
            {id: 20},
            {id: 21},
            {id: 22},
            {id: 23},
            {id: 24},
            {id: 25}
        ];
        $scope.carousel.active = 0;

        this.add = function(item, index) {
            var newArr = $scope.carousel.items.slice(0);
            if (typeof index !== 'undefined') {
                newArr.splice(index, 0, item);
            }
            else {
                newArr.push(item);
            }
            $timeout(function(){
                $scope.carousel.items = newArr;
            });
        };

        this.remove = function(index, _count) {
            var count = _count || 1;
            var newArr = $scope.carousel.items.slice(0);
            newArr.splice(index, count);
            $timeout(function(){
                $scope.carousel.items = newArr;
            });
        };

        this.mix = function() {
            var newArr = $scope.carousel.items.slice(0);
            shuffle(newArr);

            console.log($scope.carousel.items, newArr);

            $timeout(function(){
                $scope.carousel.items = newArr;
            });
        };

        function shuffle(a) {
            var j, x, i;
            for (i = a.length; i; i -= 1) {
                j = Math.floor(Math.random() * i);
                x = a[i - 1];
                a[i - 1] = a[j];
                a[j] = x;
            }
        }

        window.__ctrl = this;

    }
    demoCtrl.$inject = ['$scope', '$timeout'];

    return demoCtrl;
})();

demo.controller('demoCtrl', demoCtrl);


// Export
window.demo = demo;

})(window, document);

