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

    beforeEach(function() {
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
    });
    afterEach(function() {
        baseStyles.remove();
        fixturesStyles.remove();

        document.body.removeChild($holder);
    });

    it('should be defined', function() {
        expect(LazyCarousel).toBeDefined();
    });

    it('should be possible to postpone initialization', function() {
        var inst = createCarousel({noInit: true}, null);

        expect(inst.$holder).toBeFalsy(false);

        var elem = utils.createElement('<div><ul /></div>');
        inst.init(elem);

        expect(inst.$holder).not.toBe(false);
    });

    describe('HTML structure', function() {

        it('should keep main holder reference', function() {
            var elem = utils.appendElement($holder, '<div><ul /></div>');
            var inst = createCarousel(null, elem);

            expect(inst.$holder).toBeDefined();
            expect(inst.$holder).toBe(elem);
        });

        it('should throw an error if "holder" does not found', function() {
            var inst;

            expect(function() {
                inst = createCarousel(null, null);
            }).toThrow();
        });

        it('should throw an error if "ul" does not found', function() {
            var inst;

            expect(function() {
                inst = createCarousel(null, '<div></div>');
            }).toThrow();
        });

        it('should keep list holder reference', function() {
            var inst = createCarousel(null, '<div class="holder"><ul /></div>');

            expect(inst.$wrapper).toBeDefined();
            expect(inst.$wrapper.classList.contains('holder')).toBeTruthy();
        });
    });

    describe('Publick methods', function() {

    });

    describe('Private methods', function() {

        describe('calculateVisibility', function() {
            var calculateVisibility, clearHistroy;

            beforeEach(function() {
                var inst = createCarousel(null, '<div><ul /></div>');

                calculateVisibility = function(){
                    inst._calculateVisibility(arguments);

                    return {
                        visible: inst._visible,
                        addition: inst._addition,
                        isSimple: inst._isSimple
                    };
                };

                clearHistroy = function() {
                    inst._visible = this._addition = this._isSimple = null;
                };

            });

            fit('should return integer number', function() {
                var res = calculateVisibility(0, 0);

                expect(res.visible).toBeInteger();


                //expect(calculateVisibility(-10, 0)).toBeInteger();
                //expect(calculateVisibility(0, -10)).toBeInteger();
                //expect(calculateVisibility(10, 0)).toBeInteger();
                //expect(calculateVisibility(0, 10)).toBeInteger();
                //expect(calculateVisibility(10, 10)).toBeInteger();
            });

            it('should return positive count or zero', function() {
                expect(calculateVisibility(0, 0)).toBeGreaterThan(-1);
                expect(calculateVisibility(-10, 0)).toBeGreaterThan(-1);
                expect(calculateVisibility(0, -10)).toBeGreaterThan(-1);
                expect(calculateVisibility(10, 0)).toBeGreaterThan(-1);
                expect(calculateVisibility(0, 10)).toBeGreaterThan(-1);
                expect(calculateVisibility(10, 10)).toBeGreaterThan(-1);
            });

            it('should return odd number', function() {
                expect(calculateVisibility(0, 0)).toBeOdd();
                expect(calculateVisibility(-10, 0)).toBeOdd();
                expect(calculateVisibility(0, -10)).toBeOdd();
                expect(calculateVisibility(10, 0)).toBeOdd();
                expect(calculateVisibility(0, 10)).toBeOdd();
                expect(calculateVisibility(10, 10)).toBeOdd();
            });

            it('should return +1 than possible for even', function() {
                expect(calculateVisibility(10, 1)).toBe(11);
                expect(calculateVisibility(10, 2)).toBe(5);
            });
        });


    });
});