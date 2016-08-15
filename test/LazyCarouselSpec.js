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

function initCustomMatchers() {
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
}

function getDOMItems(inst) {

}

fdescribe('LazyCarousel', function(){
    var $holder;

    function createCarousel(opts, _html) {
        var html = _html || '<div id="testCarousel"><div><ul></ul></div></div>';
        var elem = html ? createElement(html) : null;
        if(_html === null) {
            elem = undefined;
        }
        return new LazyCarousel(elem, opts);
    }

    function createElement(html) {
        return utils.appendElement($holder, html);
    }

    function getFakeItems(items, _uniquKeyProp) {
        var res,
            obj,
            key = _uniquKeyProp || 'id';

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

    var baseStyles = null,
        fixturesStyles = null;

    beforeEach(function(done) {
        baseStyles = helpers.injectCssByUrl('/base/src/base.css');
        fixturesStyles = helpers.injectCssByUrl('/base/test/fixtures/css/main.css');

        $holder = utils.appendElement(document.body, '<div id="test_holder"></div>');

        initCustomMatchers();

        setTimeout(done, 20);
    });
    afterEach(function() {
        baseStyles.remove();
        fixturesStyles.remove();

        document.body.removeChild($holder);
    });

    describe('base', function() {
        it('should be defined', function() {
            expect(LazyCarousel).toBeDefined();
        });

        it('should make initialization initially', function() {
            spyOn(LazyCarousel.prototype, 'init');

            var inst = createCarousel({});

            expect(LazyCarousel.prototype.init).toHaveBeenCalled();
        });

        it('should be possible to postpone initialization', function() {
            spyOn(LazyCarousel.prototype, 'init');

            var inst = createCarousel({noInit: true});

            expect(LazyCarousel.prototype.init).not.toHaveBeenCalled();
        });

        it('should keep reference to root element', function() {
            var elem = createElement('<div id="testCarousel"></div>');
            var inst = createCarousel({noInit: true}, elem);

            expect(inst.$holder).toBe(elem);
        });

        it('should keep reference to root element after init', function() {
            var elem = createElement('<div id="testCarousel"><ul></ul></div>');
            var inst = createCarousel({noInit: true}, null);

            expect(inst.$holder).not.toBeDefined();

            inst.init(elem);

            expect(inst.$holder).toBe(elem);
        });

        it('should find list element', function() {
            var inst = createCarousel({}, '<div id="testCarousel"><div><ul id="list"></ul></div></div>');

            expect(inst.$list).not.toBe(null);
            expect(inst.$list.id).toBe('list');
        });

        it('should find list parent element', function() {
            var inst = createCarousel({}, '<div id="testCarousel"><ul id="list"></ul></div>');

            expect(inst.$listHolder).not.toBe(null);
            expect(inst.$listHolder.id).toBe('testCarousel');
        });
    });

    describe('updateItems', function() {
        var inst,
            holderWidth = 1000,
            itemWidth = 200;

        beforeEach(function() {
            inst = createCarousel({noInit: true});
            spyOn(inst, '_fetchElementsSize').and.callFake(function() {
                this.holderWidth = holderWidth;
                this.itemWidth = itemWidth;
            });
        });

        it('should save items', function() {
            var items = getFakeItems(10);

            inst.init();

            inst.updateItems(items);

            expect(inst.items.length).toBe(10);
        });

        it('should update visible props', function() {
            var items = getFakeItems(10);

            inst.init();

            expect(inst.isSimple).toBe(null);
            expect(inst.visible).toBe(0);
            expect(inst.addition).toBe(0);

            inst.updateItems(items);

            expect(inst.isSimple).toBe(true);
            expect(inst.visible).toBe(7);
            expect(inst.addition).toBe(0);
        });

        it('should change active item', function() {
            var items = getFakeItems(10);

            inst.init();

            inst.updateItems(items, 2);

            expect(inst.active).toBe(2);
        });

        it('should trigger _updateVisible', function() {
            spyOn(inst, '_updateVisible');

            var items = getFakeItems(10);

            inst.init();

            expect(inst._updateVisible).not.toHaveBeenCalled();

            inst.updateItems(items, 2);

            expect(inst._updateVisible).toHaveBeenCalled();
        });
    });


    describe('_updateVisible', function(){
        var inst, partialItems = [];

        beforeEach(function() {
            inst = createCarousel({noInit: true});
            spyOn(LazyCarousel.utils, 'getPartialItems').and.callFake(function() {
                return {
                    list: partialItems
                };
            });
        });

        it('should generate partial list', function() {
            partialItems = getFakeItems(10);

            inst.init();

            expect(inst.partialItems.length).toBe(0);

            inst._updateVisible();

            expect(inst.partialItems.length).toBe(10);
        });

        it('should trigger changesTracker update', function() {
            var items = getFakeItems(10);

            inst.init();

            spyOn(inst.changesTracker, 'updateList');

            inst.updateItems(items);

            expect(inst.changesTracker.updateList).toHaveBeenCalled();
        });

        it('should render partial items', function() {
            var items = getFakeItems(10);

            inst.init();

            inst.updateItems(items);

            expect(inst.isSimple).toBe(true);
            expect(inst.$list.children.length).toBe(10);
        });
    });

    describe('slideToIndex', function() {

    });

    describe('slideToDir', function() {

        it('', function() {
            // init
            // updateItems
            // expect getPartialItems to have been called with
            // slideToDir
            // expect getPartialItems to have been called with
        });
    });

    describe('resize event', function() {

    });

    describe('_addItemPre', function() {
        var inst;

        beforeEach(function() {
            inst = createCarousel({noInit: true});
        });

        it('should return new LI element in callback', function(done) {
            inst.init();

            inst._addItemPre({ id: 10 }, function($item) {
                expect($item instanceof HTMLElement).toBe(true);
                expect($item.tagName).toBe('LI');
                done();
            });
        });

    });

    describe('_removeItemPre', function() {
        var inst;

        beforeEach(function() {
            inst = createCarousel({noInit: true});
        });

        it('should call callback', function(done) {
            inst.init();

            inst._removeItemPre({}, {}, function() {
                done();
            });
        });

    });

    describe('_fetchElementsSize', function() {

        it('should be called during init phase', function() {
            var inst = createCarousel({noInit: true}, '<div id="testCarousel"><div><ul></ul></div></div>');
            spyOn(inst, '_fetchElementsSize');
            inst.init();

            expect(inst._fetchElementsSize).toHaveBeenCalled();
        });

        it('should get correct holder width', function() {
            var inst = createCarousel({}, '<div id="testCarousel" style="width: 1000px;"><div><ul></ul></div></div>');

            expect(inst.holderWidth).toBe(1000);
        });

        it('should get correct item width from fake item', function() {
            var styles =    '#testCarousel > div > ul > li {' +
                            '   width: 150px;' +
                            '}';

            helpers.injectCss(styles);

            var inst = createCarousel({}, '<div id="testCarousel"><div><ul></ul></div></div>');

            expect(inst.itemWidth).toBe(150);

            helpers.injectCss.reset();
        });
    });

    describe('_resizeHandler', function() {
        var inst;

        beforeEach(function() {
            inst = createCarousel({noInit: true});
            spyOn(inst, '_resizeHandler');
            inst.init();
        });

        afterEach(function() {

        });

        it('should add resize handler initially', function() {
            expect(inst._resizeHandler).not.toHaveBeenCalled();

            triggerEvent('resize', window);

            expect(inst._resizeHandler).toHaveBeenCalled();
        });

        it('should remove resize handler on destroy', function() {
            expect(inst._resizeHandler.calls.count()).toBe(0);

            triggerEvent('resize', window);

            expect(inst._resizeHandler.calls.count()).toBe(1);

            inst.destroy();

            triggerEvent('resize', window);

            expect(inst._resizeHandler.calls.count()).toBe(1);
        });
    });

    describe('utils', function() {
        describe('calculateVisible', function() {
            var calculateVisible = LazyCarousel.utils.calculateVisible;

            it('should be defined in utils', function() {
                expect(calculateVisible).toBeDefined();
            });

            it('should return simple mode', function() {
                var res;

                res = calculateVisible(1000, 100, 1);

                expect(res.isSimple).toBe(true);
                expect(res.visible).toBe(1);
                expect(res.addition).toBe(0);

                res = calculateVisible(1000, 100, 2);

                expect(res.isSimple).toBe(true);
                expect(res.visible).toBe(2);
                expect(res.addition).toBe(0);

                res = calculateVisible(1000, 100, 3);

                expect(res.isSimple).toBe(true);
                expect(res.visible).toBe(3);
                expect(res.addition).toBe(0);
            });

            it('should return complex mode', function() {
                var res;

                res = calculateVisible(1000, 100, 50);

                expect(res.isSimple).toBe(false);
            });

            it('should return odd visible count in complex mode', function() {
                var res;

                res = calculateVisible(1000, 100, 50);

                expect(res.isSimple).toBe(false);
                expect(res.visible).toBe(11);

                res = calculateVisible(1100, 100, 50);

                expect(res.isSimple).toBe(false);
                expect(res.visible).toBe(13);
            });

            it('should return correct addition items count', function() {
                var res;

                res = calculateVisible(1000, 100, 50);

                expect(res.isSimple).toBe(false);
                expect(res.visible).toBe(11);
                expect(res.addition).toBe(11);
            });
        });

        describe('getItemInfoById', function() {
            var getItemInfoById = LazyCarousel.utils.getItemInfoById;

            it('should be defined in utils', function() {
                expect(getItemInfoById).toBeDefined();
            });

            it('should return null if nothing found', function() {
                var res;

                res = getItemInfoById(1, []);
                expect(res).toBe(null);

                res = getItemInfoById(1, [{}, {}]);
                expect(res).toBe(null);
            });

            it('should return found item index', function() {
                var res;

                res = getItemInfoById(1, [{id: 1}]);

                expect(res.index).toBeDefined();
                expect(res.index).toBe(0);
            });

            it('should return found item data', function() {
                var res;

                res = getItemInfoById(1, [{id: 1}]);

                expect(res.data).toBeDefined();
                expect(res.data).toEqual({id: 1});
            });

            it('should be possible to change search key', function() {
                var res;

                res = getItemInfoById(1, [{__id: 1}], '__id');

                expect(res.index).toBe(0);
                expect(res.data).toEqual({__id: 1});
            });
        });

        describe('normalizeIndex', function() {
            var normalizeIndex = LazyCarousel.utils.normalizeIndex;

            it('should be defined in utils', function() {
                expect(normalizeIndex).toBeDefined();
            });

            it('should return correct index for single mode', function() {
                var res;

                res = normalizeIndex(0, 10);
                expect(res).toBe(0);

                res = normalizeIndex(5, 10);
                expect(res).toBe(5);

                res = normalizeIndex(9, 10);
                expect(res).toBe(9);
            });

            it('should return correct index for complex mode', function() {
                var res;

                res = normalizeIndex(10, 10);
                expect(res).toBe(0);

                res = normalizeIndex(11, 10);
                expect(res).toBe(1);

                res = normalizeIndex(-1, 10);
                expect(res).toBe(9);
            });

            it('should return correct index for too complex mode', function() {
                var res;

                res = normalizeIndex(100, 10);
                expect(res).toBe(0);

                res = normalizeIndex(101, 10);
                expect(res).toBe(1);

                res = normalizeIndex(-101, 10);
                expect(res).toBe(9);
            });
        });

        describe('getPartialItems', function(){
            var getPartialItems = LazyCarousel.utils.getPartialItems;

            it('should be defined in utils', function() {
                expect(getPartialItems).toBeDefined();
            });

            describe('simple mode', function() {
                var isSimple = true,
                    addition = 0;

                it('should return partials items', function() {
                    var items = getFakeItems([1, 2, 3, 4, 5]);

                    var res = getPartialItems(items, 0, 5, addition, isSimple);

                    expect(res.after.length).toBe(3);
                    expect(res.before.length).toBe(2);

                    expect(res.after).toEqual(getFakeItems([1, 2, 3]));
                    expect(res.before).toEqual(getFakeItems([4, 5]));

                    expect(res.list).toEqual(getFakeItems([4, 5, 1, 2, 3]));
                });

                it('should return partials items for even count', function() {
                    var items = getFakeItems([1, 2, 3, 4, 5, 6]);

                    var res = getPartialItems(items, 0, 6, addition, isSimple);

                    expect(res.after.length).toBe(4);
                    expect(res.before.length).toBe(2);

                    expect(res.after).toEqual(getFakeItems([1, 2, 3, 4]));
                    expect(res.before).toEqual(getFakeItems([5, 6]));

                    expect(res.list).toEqual(getFakeItems([5, 6, 1, 2, 3, 4]));
                });

                it('should return partials items with some offset', function() {
                    var items = getFakeItems([1, 2, 3, 4, 5, 6]);

                    var res = getPartialItems(items, 1, 6, addition, isSimple);

                    expect(res.after.length).toBe(4);
                    expect(res.before.length).toBe(2);

                    expect(res.after).toEqual(getFakeItems([2, 3, 4, 5]));
                    expect(res.before).toEqual(getFakeItems([6, 1]));

                    expect(res.list).toEqual(getFakeItems([6, 1, 2, 3, 4, 5]));
                });

                it('should return partials items with some big offset', function() {
                    var items = getFakeItems([1, 2, 3, 4, 5, 6]);

                    var res = getPartialItems(items, 5, 6, addition, isSimple);

                    expect(res.after.length).toBe(4);
                    expect(res.before.length).toBe(2);

                    expect(res.after).toEqual(getFakeItems([6, 1, 2, 3]));
                    expect(res.before).toEqual(getFakeItems([4, 5]));

                    expect(res.list).toEqual(getFakeItems([4, 5, 6, 1, 2, 3]));
                });
            });

            describe('infinite mode', function() {
                var isSimple = false;

                it('should return partials items', function() {
                    var items = getFakeItems([1, 2, 3, 4, 5]);

                    var res = getPartialItems(items, 0, 1, 1, isSimple);

                    expect(res.after.length).toBe(2);
                    expect(res.before.length).toBe(1);

                    expect(res.after).toEqual(getFakeItems([1, 2]));
                    expect(res.before).toEqual(getFakeItems([5]));

                    expect(res.list).toEqual(getFakeItems([5, 1, 2]));
                });

                it('should return partials for a lot items', function() {
                    var items = getFakeItems(50);

                    var res = getPartialItems(items, 0, 5, 5, isSimple);

                    expect(res.after.length).toBe(8);
                    expect(res.before.length).toBe(7);

                    expect(res.after).toEqual(getFakeItems([0, 1, 2, 3, 4, 5, 6, 7]));
                    expect(res.before).toEqual(getFakeItems([43, 44, 45, 46, 47, 48, 49]));

                    expect(res.list).toEqual(getFakeItems([43, 44, 45, 46, 47, 48, 49, 0, 1, 2, 3, 4, 5, 6, 7]));
                });

                it('should return partials for a lot items with some offset', function() {
                    var items = getFakeItems(50);

                    var res = getPartialItems(items, 20, 5, 5, isSimple);

                    expect(res.after.length).toBe(8);
                    expect(res.before.length).toBe(7);

                    expect(res.after).toEqual(getFakeItems([20, 21, 22, 23, 24, 25, 26, 27]));
                    expect(res.before).toEqual(getFakeItems([13, 14, 15, 16, 17, 18, 19]));

                    expect(res.list).toEqual(getFakeItems([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]));
                });
            });
        });
    });

});