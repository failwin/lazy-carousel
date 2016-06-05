var helpers = window.__helpers;
var utils = window.utils;
var LazyCarousel = window.LazyCarousel;

function triggerEvent(name, element) {
    var event;

    if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
        event.initEvent(name, true, true);
    } else {
        event = document.createEventObject();
        event.eventType = name;
    }

    event.eventName = name;

    if (document.createEvent) {
        element.dispatchEvent(event);
    } else {
        element.fireEvent("on" + event.eventType, event);
    }
}

describe('LazyCarousel', function(){
    var $holder;

    function createCarousel(opts, html) {
        var elem = html ? utils.appendElement($holder, html) : null;
        return new LazyCarousel(elem, opts);
    }

    var baseStyles = null,
        fixturesStyles = null;

    beforeEach(function(done) {
        baseStyles = helpers.injectCssByUrl('/base/src/base.css');
        fixturesStyles = helpers.injectCssByUrl('/base/test/fixtures/css/main.css');

        $holder = utils.appendElement(document.body, '<div id="test_holder"></div>');

        jasmine.addMatchers({
            toBeInteger: function(util, customEqualityTesters) {
                return {
                    compare: function(actual, expected) {
                        var result = {
                            pass: false,
                            message: 'Expected ' + actual + ' to be integer number'
                        };

                        if (actual === parseInt(actual, 10)) {
                            result.pass = true;
                            result.message = 'Expected ' + actual + ' to be not integer number';
                        }

                        return result;
                    }
                }
            },
            toBeOdd: function(util, customEqualityTesters) {
                return {
                    compare: function(actual, expected) {
                        var result = {
                            pass: false,
                            message: 'Expected ' + actual + ' to be not odd number'
                        };

                        if (actual % 2 !== 0) { // 1, 3, 5
                            result.pass = true;
                            result.message = 'Expected ' + actual + ' to be odd number';
                        }

                        return result;
                    }
                }
            }
        });

        setTimeout(done, 20);
    });
    afterEach(function() {
        //baseStyles.remove();
        //fixturesStyles.remove();

        //document.body.removeChild($holder);
    });

    it('should be defined', function() {
        expect(LazyCarousel).toBeDefined();
    });

    it('should be possible to postpone initialization', function() {
        var inst = createCarousel({noInit: true}, null);

        expect(inst.$holder).toBeFalsy();

        var temp = utils.createElement('<div id="testCarousel"><div><ul></ul></div></div>');
        var elem = utils.appendElement($holder, temp);
        inst.init(elem);

        expect(inst.$holder).not.toBe(false);
    });

    describe('base', function() {

        it('should calculate elements width from CSS', function() {
            var inst = createCarousel(null, '<div id="testCarousel"><div><ul></ul></div></div>');

            expect(inst._itemWidth).toBe(150);
        });
    });
});