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

    function getFakePartialItems(items, _uniqueKeyProp) {
        var res,
            obj,
            key = _uniqueKeyProp || 'id';

        if (utils.isArray(items)) {
            res = items.map(function(val) {
                obj = {};
                obj[key] = val;
                obj.__i = val; // global index
                return obj;
            });
        }
        else {
            res = [];
            for (var i = 0; i < items; i++) {
                obj = {};
                obj[key] = i;
                obj.__i = i; // global index
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

    describe('slideToDir', function() {
        var inst,
            elem,
            items,
            partialItems = [],
            animatePromise;

        beforeEach(function() {
            var html =  '<div id="testCarousel">' +
                        '   <div>' +
                        '       <ul></ul>' +
                        '   </div>' +
                        '</div>';

            elem = createElement(html);
            inst = createCarousel({noInit: true}, elem);

            spyOn(LazyCarousel.utils, 'getPartialItems').and.callFake(function(){
                return {
                    list: partialItems,
                    _partialItemsBefore: 0,
                    _partialItemsAfter: 0
                };
            });

            spyOn(inst, '_animateOffset').and.callFake(function(){
                return Promise.resolve();
            });

            items = getFakeItems(10);
            partialItems = getFakeItems([1,2,3,4,5]);

            inst.init();
            inst.updateItems(items);
        });

        afterEach(function() {

        });

        it('should check maximum offset', function(done) {
            spyOn(inst, '_getMaxSlideCount');

            inst.slideToDir(1)
            .then(function(){
                expect(inst._getMaxSlideCount).toHaveBeenCalled();
                expect(inst._getMaxSlideCount).toHaveBeenCalledWith(1);

                done();
            });
        });

        it('should update active index', function(done) {
            expect(inst.active).toBe(0);

            inst.slideToDir(1)
            .then(function(){
                expect(inst.active).toBe(1);

                done();
            });
        });

        it('should update active index for negative dir', function(done) {
            expect(inst.active).toBe(0);

            inst.slideToDir(-1)
            .then(function(){
                expect(inst.active).toBe(items.length - 1);

                done();
            });
        });

        it('should ask for new items with new offset', function(done) {
            LazyCarousel.utils.getPartialItems.calls.reset();

            inst.slideToDir(1)
            .then(function(){
                expect(LazyCarousel.utils.getPartialItems).toHaveBeenCalled();
                expect(LazyCarousel.utils.getPartialItems).toHaveBeenCalledWith(
                    items,
                    1,
                    jasmine.any(Number),
                    jasmine.any(Number),
                    jasmine.any(Boolean)
                );

                done();
            });
        });

        it('should trigger items update', function(done) {
            spyOn(inst, '_updateVisible');

            inst.slideToDir(1)
            .then(function(){
                expect(inst._updateVisible).toHaveBeenCalled();

                done();
            });
        });

        it('should trigger list centering', function(done) {
            spyOn(inst, '_centerList');

            inst.slideToDir(1)
            .then(function(){
                expect(inst._centerList).toHaveBeenCalled();

                done();
            });
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

    describe('_getItemTemplate', function() {
        var inst,
            elem,
            items,
            partialItems = [];

        beforeEach(function() {
            items = getFakeItems(10);
            var html =  '<div id="testCarousel">' +
                        '   <div>' +
                        '       <ul></ul>' +
                        '   </div>' +
                        '</div>';

            elem = createElement(html);
            inst = createCarousel({noInit: true}, elem);

            spyOn(LazyCarousel.utils, 'getPartialItems').and.callFake(function(){
                return {
                    list: partialItems,
                    _partialItemsBefore: 0,
                    _partialItemsAfter: 0
                };
            });
        });

        it('should be called "_getItemTemplate" for items rendering', function() {
            partialItems = getFakeItems([1,2,3,4,5]);

            spyOn(inst, '_getItemTemplate');

            inst.init();
            inst.updateItems(items);

            expect(inst._getItemTemplate).toHaveBeenCalled();
            expect(inst._getItemTemplate.calls.count()).toBe(5);
        });

        it('should accept appropriate item data', function() {
            partialItems = getFakeItems([1,2,3,4,5]);

            var log = [];

            spyOn(inst, '_getItemTemplate').and.callFake(function(data) {
                log.push(data);
            });

            inst.init();
            inst.updateItems(items);

            expect(log).toEqual(partialItems);
        });

        it('should return HTML string', function() {
            partialItems = getFakeItems([1,2,3,4,5]);

            spyOn(inst, '_getItemTemplate').and.callFake(function(data) {
                return '<li class="test-item">[' + data.id + ']</li>';
            });

            inst.init();
            inst.updateItems(items);

            var $items = elem.querySelectorAll('.test-item');

            expect($items.length).toBe(5);
            expect(String.trim(elem.textContent)).toBe('[1][2][3][4][5]');
        });
    });

    xdescribe('_centerList', function() {
        var inst,
            elem,
            items,
            holderWidth,
            itemWidth;

        function getOffsetLeft(itemWidth, holderWidth, active, visible, addition, isSimple) {

        }

        beforeEach(function() {
            holderWidth = 1000;
            itemWidth = 200;

            var styles =    '#testCarousel > div > ul > li {' +
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
        });

        it('should be centered correct', function() {
            items = getFakeItems(10);

            inst.init();
            inst.updateItems(items);

            var expectedOffset = getOffsetLeft(
                inst.itemWidth,
                inst.itemWidth
            );

            expect(inst.isSimple).toBe(true);
            expect(inst.offsetLeft).toBe();
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

        describe('globalToPartialIndex/partialToGlobalIndex', function() {
            var partialToGlobalIndex = LazyCarousel.utils.partialToGlobalIndex,
                isSimple;

            beforeEach(function(){
                isSimple = false;
            });

            it('should be defined in utils', function() {
                expect(partialToGlobalIndex).toBeDefined();
            });

            it('should return correct global index', function() {
                var res;

                res = partialToGlobalIndex(0, 0, 11, 9, isSimple);
                expect(res).toBe(7);

                res = partialToGlobalIndex(0, 0, 11, 3, isSimple);
                expect(res).toBe(10);

                res = partialToGlobalIndex(1, 0, 11, 9, isSimple);
                expect(res).toBe(8);

                res = partialToGlobalIndex(1, 0, 11, 3, isSimple);
                expect(res).toBe(0);

                res = partialToGlobalIndex(8, 0, 11, 9, isSimple);
                expect(res).toBe(4);

                res = partialToGlobalIndex(7, 0, 11, 9, isSimple);
                expect(res).toBe(3);
            });

            it('should return -1 if index not found in global', function() {
                var res;

                res = partialToGlobalIndex(9, 0, 11, 9, isSimple);
                expect(res).toBe(-1);

                res = partialToGlobalIndex(13, 0, 11, 9, isSimple);
                expect(res).toBe(-1);
            });

            fdescribe('simple mode', function(){

                beforeEach(function(){
                    isSimple = true;
                });

                it('should return correct partial index', function() {
                    var res;

                    res = partialToGlobalIndex(0, 0, 11, 11, isSimple);
                    expect(res).toBe(6);

                    res = partialToGlobalIndex(1, 0, 11, 11, isSimple);
                    expect(res).toBe(7);

                    res = partialToGlobalIndex(9, 0, 11, 11, isSimple);
                    expect(res).toBe(4);

                    res = partialToGlobalIndex(10, 0, 11, 11, isSimple);
                    expect(res).toBe(5);

                });

                it('should return -1 if not partial range', function() {
                    var res;

                    res = partialToGlobalIndex(20, 0, 11, 11, isSimple);
                    expect(res).toBe(-1);
                });
            });

        });

        describe('globalToPartialIndex', function() {
            var globalToPartialIndex = LazyCarousel.utils.globalToPartialIndex,
                isSimple;

            beforeEach(function(){
                isSimple = false;
            });

            it('should be defined in utils', function() {
                expect(globalToPartialIndex).toBeDefined();
            });

            it('should return correct partial index', function() {
                var res;

                res = globalToPartialIndex(0, 0, 11, 9, isSimple);
                expect(res).toBe(4);

                res = globalToPartialIndex(0, 0, 11, 3, isSimple);
                expect(res).toBe(1);

                res = globalToPartialIndex(1, 0, 11, 9, isSimple);
                expect(res).toBe(5);

                res = globalToPartialIndex(1, 0, 11, 3, isSimple);
                expect(res).toBe(2);

                res = globalToPartialIndex(9, 0, 11, 9, isSimple);
                expect(res).toBe(2);

                res = globalToPartialIndex(10, 0, 11, 9, isSimple);
                expect(res).toBe(3);

            });

            it('should return -1 if index not found in partial', function() {
                var res;

                res = globalToPartialIndex(5, 0, 11, 9, isSimple);
                expect(res).toBe(-1);

            });

            describe('simple mode', function(){

                beforeEach(function(){
                    isSimple = true;
                });

                it('should return correct partial index', function() {
                    var res;

                    res = globalToPartialIndex(0, 0, 11, 11, isSimple);
                    expect(res).toBe(5);

                    res = globalToPartialIndex(1, 0, 11, 11, isSimple);
                    expect(res).toBe(6);

                    res = globalToPartialIndex(9, 0, 11, 11, isSimple);
                    expect(res).toBe(3);

                    res = globalToPartialIndex(10, 0, 11, 11, isSimple);
                    expect(res).toBe(4);

                });

                it('should return not -1 for simple mode', function() {
                    var res;

                    res = globalToPartialIndex(5, 0, 11, 11, isSimple);
                    expect(res).not.toBe(-1);
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
                    var items = getFakeItems([0, 1, 2, 3, 4]);

                    var res = getPartialItems(items, 0, 5, addition, isSimple);

                    expect(res.after.length).toBe(3);
                    expect(res.before.length).toBe(2);

                    expect(res.after).toEqual(getFakePartialItems([0, 1, 2]));
                    expect(res.before).toEqual(getFakePartialItems([3, 4]));

                    expect(res.list).toEqual(getFakePartialItems([3, 4, 0, 1, 2]));
                });

                it('should return partials items for even count', function() {
                    var items = getFakePartialItems([0, 1, 2, 3, 4, 5]);

                    var res = getPartialItems(items, 0, 6, addition, isSimple);

                    expect(res.after.length).toBe(4);
                    expect(res.before.length).toBe(2);

                    expect(res.after).toEqual(getFakePartialItems([0, 1, 2, 3]));
                    expect(res.before).toEqual(getFakePartialItems([4, 5]));

                    expect(res.list).toEqual(getFakePartialItems([4, 5, 0, 1, 2, 3]));
                });

                it('should return partials items with some offset', function() {
                    var items = getFakeItems([0, 1, 2, 3, 4, 5]);

                    var res = getPartialItems(items, 1, 6, addition, isSimple);

                    expect(res.after.length).toBe(4);
                    expect(res.before.length).toBe(2);

                    expect(res.after).toEqual(getFakePartialItems([1, 2, 3, 4]));
                    expect(res.before).toEqual(getFakePartialItems([5, 0]));

                    expect(res.list).toEqual(getFakePartialItems([5, 0, 1, 2, 3, 4]));
                });

                it('should return partials items with some big offset', function() {
                    var items = getFakeItems([0, 1, 2, 3, 4, 5]);

                    var res = getPartialItems(items, 5, 6, addition, isSimple);

                    expect(res.after.length).toBe(4);
                    expect(res.before.length).toBe(2);

                    expect(res.after).toEqual(getFakePartialItems([5, 0, 1, 2]));
                    expect(res.before).toEqual(getFakePartialItems([3, 4]));

                    expect(res.list).toEqual(getFakePartialItems([3, 4, 5, 0, 1, 2]));
                });
            });

            describe('infinite mode', function() {
                var isSimple = false;

                it('should return partials items', function() {
                    var items = getFakeItems([0, 1, 2, 3, 4]);

                    var res = getPartialItems(items, 0, 1, 1, isSimple);

                    expect(res.after.length).toBe(2);
                    expect(res.before.length).toBe(1);

                    expect(res.after).toEqual(getFakePartialItems([0, 1]));
                    expect(res.before).toEqual(getFakePartialItems([4]));

                    expect(res.list).toEqual(getFakePartialItems([4, 0, 1]));
                });

                it('should return partials for a lot items', function() {
                    var items = getFakeItems(50);

                    var res = getPartialItems(items, 0, 5, 5, isSimple);

                    expect(res.after.length).toBe(8);
                    expect(res.before.length).toBe(7);

                    expect(res.after).toEqual(getFakePartialItems([0, 1, 2, 3, 4, 5, 6, 7]));
                    expect(res.before).toEqual(getFakePartialItems([43, 44, 45, 46, 47, 48, 49]));

                    expect(res.list).toEqual(getFakePartialItems([43, 44, 45, 46, 47, 48, 49, 0, 1, 2, 3, 4, 5, 6, 7]));
                });

                it('should return partials for a lot items with some offset', function() {
                    var items = getFakeItems(50);

                    var res = getPartialItems(items, 20, 5, 5, isSimple);

                    expect(res.after.length).toBe(8);
                    expect(res.before.length).toBe(7);

                    expect(res.after).toEqual(getFakePartialItems([20, 21, 22, 23, 24, 25, 26, 27]));
                    expect(res.before).toEqual(getFakePartialItems([13, 14, 15, 16, 17, 18, 19]));

                    expect(res.list).toEqual(getFakePartialItems([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]));
                });
            });
        });
    });

});