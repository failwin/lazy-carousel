import utils from 'my-utils';
import * as helpers from './helpers.js';
import LazyCarousel from '../src/LazyCarousel.js';

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

fdescribe('LazyCarousel', function(){
    var $holder,
        baseStyles,
        fixturesStyles;

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

    beforeEach(function(done) {
        //baseStyles = helpers.injectCssByUrl('/base/src/base.css');
        //fixturesStyles = helpers.injectCssByUrl('/base/test/fixtures/css/main.css');

        $holder = utils.appendElement(document.body, '<div id="test_holder"></div>');

        setTimeout(done, 20);
    });
    afterEach(function() {
        //baseStyles.remove();
        //fixturesStyles.remove();

        document.body.removeChild($holder);
    });

    describe('base', function() {
        var inst;

        it('should be defined', function() {
            expect(LazyCarousel).toBeDefined();
        });

        it('should make initialization initially', function() {
            spyOn(LazyCarousel.prototype, 'init');

            inst = createCarousel({});

            expect(LazyCarousel.prototype.init).toHaveBeenCalled();
        });

        it('should be possible to postpone initialization', function() {
            spyOn(LazyCarousel.prototype, 'init');

            inst = createCarousel({noInit: true});

            expect(LazyCarousel.prototype.init).not.toHaveBeenCalled();
        });

        it('should keep reference to root element', function() {
            var elem = createElement('<div id="testCarousel"></div>');
            inst = createCarousel({noInit: true}, elem);

            expect(inst.$holder).toBe(elem);
        });

        it('should keep reference to root element after init', function() {
            var elem = createElement('<div id="testCarousel"><ul></ul></div>');
            inst = createCarousel({noInit: true}, null);

            expect(inst.$holder).not.toBeDefined();

            inst.init(elem);

            expect(inst.$holder).toBe(elem);
        });

        it('should find list element', function() {
            inst = createCarousel({noInit: true}, null);

            expect(inst.$list).toBe(null);

            var elem = createElement('<div id="testCarousel"><div><ul id="list"></ul></div></div>');
            inst.init(elem);

            expect(inst.$list.id).toBe('list');
        });

        it('should find list parent element', function() {
            inst = createCarousel({noInit: true}, null);

            expect(inst.$listHolder).toBe(null);

            var elem = createElement('<div id="testCarousel"><div id="listParent"><ul></ul></div></div>');
            inst.init(elem);

            expect(inst.$listHolder.id).toBe('listParent');
        });
    });

    describe('resize', function() {
        var inst;

        beforeEach(function() {
            inst = createCarousel({noInit: true});
        });

        afterEach(function() {

        });

        it('should trigger "_fetchElementsSize" function', function() {
            spyOn(inst, '_fetchElementsSize');

            inst.init();

            expect(inst._fetchElementsSize).toHaveBeenCalled();
        });

        it('should trigger "_updateVisible" function', function() {
            spyOn(inst, '_updateVisible');

            inst.init();

            expect(inst._updateVisible).toHaveBeenCalled();
        });

        describe('resize calls', function() {
            beforeEach(function() {
                spyOn(inst, 'resize');
            });

            it('should be called immediately on init', function() {
                inst.init();

                expect(inst.resize).toHaveBeenCalled();
            });

            it('should be called on resize event', function() {
                inst.init();

                triggerEvent('resize', window);

                expect(inst.resize).toHaveBeenCalled();
            });

            it('should not be called after destroy', function() {
                inst.init();

                inst.resize.calls.reset();

                inst.destroy();

                triggerEvent('resize', window);

                expect(inst.resize).not.toHaveBeenCalled();
            });
        });
    });

    describe('updateItems', function() {
        var inst,
            elem,
            items,
            partialItems = [];

        beforeEach(function() {
            var holderWidth = 1000,
                itemWidth = 200,
                styles =    '#testCarousel > div > ul > li {' +
                            '   width: '+ itemWidth +'px;' +
                            '}',
                html =  '<div id="testCarousel" style="width: '+ holderWidth +'px;">' +
                        '   <div>' +
                        '       <ul></ul>' +
                        '   </div>' +
                        '</div>';

            elem = createElement(html);

            helpers.injectCss(styles);

            inst = createCarousel({noInit: true}, elem);

            items = getFakeItems(10);
            partialItems = getFakeItems(5);

            spyOn(LazyCarousel.utils, 'getPartialItems').and.callFake(function(){
                return {
                    list: partialItems,
                    _partialItemsBefore: 0,
                    _partialItemsAfter: 0
                };
            });
        });

        afterEach(function() {
            helpers.injectCss.reset();
            LazyCarousel.utils.getPartialItems.calls.reset();
            LazyCarousel.utils.getPartialItems.and.stub();
        });

        it('should trigger "getPartialItems" helper function with appropriate params', function() {
            inst.init();

            LazyCarousel.utils.getPartialItems.calls.reset();

            inst.updateItems(items);

            expect(LazyCarousel.utils.getPartialItems).toHaveBeenCalled();
            expect(LazyCarousel.utils.getPartialItems).toHaveBeenCalledWith(
                items,
                inst.active,
                inst.visible,
                inst.addition,
                inst.isSimple
            );
        });

        it('should update active index', function() {
            inst.init();

            var activeIndex = 2;
            inst.updateItems(items, activeIndex);

            expect(inst.active).toBe(activeIndex);
        });

        it('should render partial items', function() {
            partialItems = getFakeItems([1,2,3,4,5]);

            inst.init();

            inst.updateItems(items);

            expect(String.trim(elem.textContent)).toBe('12345');
        });
    });

    describe('_fetchElementsSize', function() {
        var inst,
            styles;

        beforeEach(function() {
            styles =    '#testCarousel > div > ul > li {' +
                        '   width: 150px;' +
                        '}';

            helpers.injectCss(styles);

            inst = createCarousel({noInit: true}, '<div id="testCarousel" style="width: 1000px;"><div><ul></ul></div></div>');
        });

        afterEach(function() {
            helpers.injectCss.reset();
        });

        it('should be called during init phase', function() {
            spyOn(inst, '_fetchElementsSize');

            inst.init();

            expect(inst._fetchElementsSize).toHaveBeenCalled();
        });

        it('should get correct holder width', function() {
            inst.init();

            expect(inst.holderWidth).toBe(1000);
        });

        it('should get correct item width from fake item', function() {
            inst.init();

            expect(inst.itemWidth).toBe(150);
        });
    });

    describe('_updateVisible', function() {
        var inst,
            partialItems = [];

        beforeEach(function() {
            inst = createCarousel({noInit: true});

            spyOn(LazyCarousel.utils, 'getPartialItems').and.callFake(function(){
                return {
                    list: partialItems,
                    _partialItemsBefore: 0,
                    _partialItemsAfter: 0
                };
            });

        });

        afterEach(function() {

        });

        it('should trigger changesTracker call', function() {
            inst.init();

            spyOn(inst.changesTracker, 'updateList').and.callThrough();

            inst._updateVisible();

            expect(inst.changesTracker.updateList).toHaveBeenCalled();
            expect(inst.changesTracker.updateList).toHaveBeenCalledWith(partialItems);
        });

        it('should render partial items', function() {
            spyOn(inst, '_getItemTemplate').and.callFake(function(item){
                return '<li id="item-'+ item.id +'" class="item"></li>';
            });

            partialItems = getFakeItems([1, 2, 3, 4, 5]);

            inst.init();

            inst._updateVisible();

            var $items = inst.$list.children;

            expect($items.length).toBe(5);
            expect($items[0].id).toBe('item-1');
            expect($items[4].id).toBe('item-5');
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

        xdescribe('globalToPartialIndex/partialToGlobalIndex', function() {
            var globalToPartialIndex = LazyCarousel.utils.globalToPartialIndex,
                partialToGlobalIndex = LazyCarousel.utils.partialToGlobalIndex;

            it('should be defined in utils', function() {
                expect(globalToPartialIndex).toBeDefined();
                expect(partialToGlobalIndex).toBeDefined();
            });

            describe('globalToPartialIndex', function() {

                it('should return correct partial index', function() {
                    var res;

                    res = globalToPartialIndex(0, 11, 9);
                    expect(res).toBe(4);

                    res = globalToPartialIndex(0, 11, 3);
                    expect(res).toBe(1);

                    res = globalToPartialIndex(1, 11, 9);
                    expect(res).toBe(5);

                    res = globalToPartialIndex(1, 11, 3);
                    expect(res).toBe(2);
                });
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