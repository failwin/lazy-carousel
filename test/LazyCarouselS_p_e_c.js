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

function getDataList(list, dataAtrName) {
    var arr = Array.prototype.slice.call(list, 0);

    return arr.map(function($elem){
        return $elem.getAttribute(dataAtrName);
    });
};

describe('LazyCarouselSpec', function(){
    var $holder;

    utils.appendElement(document.body, '<div id="test_holder"></div>');
    $holder = document.getElementById('test_holder');

    function createElement(str){
        utils.prependElement($holder, str);
        return $holder.firstChild;
    }

    var stylesRemove = null;

    beforeEach(function(){
    		stylesRemove = helpers.injectCssByUrl('/base/test/fixtures/css/main.css');
    });
    afterEach(function(){
    		stylesRemove();
        utils.clearElement($holder);
    });

    describe('basic', function(){
        it('should have correct properties', function() {
            var elem = createElement('<div class="gallery_carousel"><ul class="list"></ul></div>');

            var inst = new LazyCarousel(elem);

            expect(inst).toBeDefined();
            expect(inst.opts).toBeDefined();
            expect(inst.$events).toBeDefined();
        });

        it('should add resize handler', function() {
            var elem = createElement('<div class="gallery_carousel"><ul class="list"></ul></div>');

            var inst = new LazyCarousel(elem, {
                noInit: true
            });

            //var callback = jasmine.createSpy('callback');
            spyOn(inst, 'resize');

            inst.init();

            expect(inst.resize).toHaveBeenCalled();
            expect(inst.resize.calls.count()).toEqual(1);

            triggerEvent('resize', window);

            expect(inst.resize.calls.count()).toEqual(2);
        });

        it('should remove resize handler', function() {
            var elem = createElement('<div class="gallery_carousel"><ul class="list"></ul></div>');

            var inst = new LazyCarousel(elem, {
                noInit: true
            });

            spyOn(inst, 'resize');

            inst.init();

            expect(inst.resize).toHaveBeenCalled();
            expect(inst.resize.calls.count()).toBe(1);

            inst._detachHandlers();

            triggerEvent('resize', window);

            expect(inst.resize.calls.count()).toBe(1);
        });

        it('should check basic template', function() {
            var elem = createElement('<div class="gallery_carousel"><ul class="list"></ul></div>');

            var inst = new LazyCarousel(elem, {
                noInit: true
            });

            inst.init();

            expect(inst.$holder).toBeTruthy();
            expect(inst.$holder).toBe(elem);

            expect(inst.$list).toBeTruthy();
            expect(inst.$list).toBe(elem.firstChild);
        });

        it('should calculate elements width', function() {
            var elemStr =   '<div class="gallery_carousel">' +
                '<div class="list_holder" style="width: 999px;">' +
                '<ul class="list">' +
                '<li style="width: 111px;"></li>' +
                '</ul>' +
                '</div>' +
                '</div>';

            var elem = createElement(elemStr);

            var inst = new LazyCarousel(elem, {
                noInit: true
            });

            inst.items = [1,2,3];

            inst.init();

            expect(inst._holderWidth).toBe(999);
            expect(inst._itemWidth).toBe(111);
        });

        it('should calculate elements width if list is empty (from CSS)', function() {
            var elemStr =   '<div class="gallery_carousel">' +
                '<div class="list_holder" style="width: 999px;">' +
                '<ul class="list">' +
                '</ul>' +
                '</div>' +
                '</div>';

            var elem = createElement(elemStr);

            var inst = new LazyCarousel(elem, {
                noInit: true
            });

            //inst.items = [1,2,3];

            inst.init();

            expect(inst._holderWidth).toBe(999);
            expect(inst._itemWidth).toBe(150); // main.css

            expect(inst.$list.firstChild).toBe(null);
        });

        it('should calculate visible elemtnts', function() {
            var elemStr =   '<div class="gallery_carousel">' +
                '<div class="list_holder" style="width: 1000px;">' +
                '<ul class="list">' +
                '<li class="list" style="width: 501px;"></li>' +
                '</ul>' +
                '</div>' +
                '</div>';

            var elem = createElement(elemStr);

            var inst = new LazyCarousel(elem, {
                noInit: true
            });

            inst.items = [1,2,3];

            inst.init();

            //expect(inst._holderWidth).toBe(1000);
            //expect(inst._itemWidth).toBe(900);

            // -----------||----------------|------------------||-----------
            // --[--------||-------][-----------------][-------||--------]----
            // -----------||----------------|------------------||-----------

            expect(inst._visible).toBe(1);

        });
    });

    describe('_updateVisible', function(){
        var inst;

        function getStringOfContent(list) {
            list = list || [];
            list = Array.prototype.slice.call(list, 0);

            var arr = list.map(function(item) {
                return utils.getElementText(item);
            });

            return arr.join(',');
        };

        beforeEach(function(){
            var elem = createElement('<div class="gallery_carousel"><div><ul class="list"></ul></div></div>');

            inst = new LazyCarousel(elem, {
                noInit: true
            });
            inst._getItemTemplate = function(item) {
                return '<li class="item" data-id="'+ item._id +'">'+ item.id +'</li>';
            };

        });
        afterEach(function(){

        });

        it('should return correct ', function() {

        });

        describe('_calculateVisibility', function() {

            beforeEach(function(){
                spyOn(inst, '_updateVisible');
            });

            it('should return correct ', function() {
                var items, partialItems;

                inst.init();

                expect(inst._visible).toBe(0);
                expect(inst._addition).toBe(0);
                expect(inst._updateVisible).not.toHaveBeenCalled();

                items = [
                    {id: 0}
                ];

                inst._itemWidth = 200;
                inst._holderWidth = 1000;
                inst.items = items;
                inst._count = items.length;

                inst._calculateVisibility();

                expect(inst._visible).toBe(1);
                expect(inst._addition).toBe(0);
                expect(inst._isSimple).toBe(true);
                expect(inst._updateVisible).toHaveBeenCalled();
                expect(inst._updateVisible.calls.count()).toBe(1);

                // ----

                inst._calculateVisibility();

                expect(inst._visible).toBe(1);
                expect(inst._addition).toBe(0);
                expect(inst._isSimple).toBe(true);
                expect(inst._updateVisible.calls.count()).toBe(1);

                // ----

                items = [
                    {id: 0},
                    {id: 1},
                    {id: 2}
                ];

                inst.items = items;
                inst._count = items.length;

                inst._calculateVisibility();

                expect(inst._visible).toBe(3);
                expect(inst._addition).toBe(0);
                expect(inst._isSimple).toBe(true);
                expect(inst._updateVisible.calls.count()).toBe(2);

                // ----

                items = [
                    {id: 0},
                    {id: 1},
                    {id: 2},
                    {id: 4},
                    {id: 5},
                    {id: 6}
                ];

                inst.items = items;
                inst._count = items.length;

                inst._calculateVisibility();

                expect(inst._visible).toBe(5);
                expect(inst._addition).toBe(4);
                expect(inst._isSimple).toBe(false);
                expect(inst._updateVisible.calls.count()).toBe(3);

                // ----

                inst._calculateVisibility();

                expect(inst._visible).toBe(5);
                expect(inst._addition).toBe(4);
                expect(inst._isSimple).toBe(false);
                expect(inst._updateVisible.calls.count()).toBe(3);

                // ----

                items = [
                    {id: 0},
                    {id: 1},
                    {id: 2},
                    {id: 4},
                    {id: 5},
                    {id: 6},
                    {id: 7},
                    {id: 8}
                ];

                inst.items = items;
                inst._count = items.length;

                inst._calculateVisibility(true);

                expect(inst._visible).toBe(5);
                expect(inst._addition).toBe(4);
                expect(inst._isSimple).toBe(false);
                expect(inst._updateVisible.calls.count()).toBe(3);

            });

        });

        describe('_getPartialItems', function(){
            var getPartialItems;

            function getStringOfIds(list) {
                list = list || [];
                list = Array.prototype.slice.call(list, 0);

                var arr = list.map(function(item) {
                    return item.id;
                });

                return arr.join(',');
            };

            beforeEach(function(){
                getPartialItems = inst._getPartialItems.bind(inst);

                // _getPartialItems(active, visible, addition, list);
            });

            it('should return correct ', function() {
                var partialItems;

                var items1 = [
                    {id: 0}
                ];

                partialItems = getPartialItems(0, 1, 0, true, items1);

                expect(getStringOfIds(partialItems)).toBe('0');

                // ----

                var items2 = [
                    {id: 0},
                    {id: 1}
                ];

                partialItems = getPartialItems(1, 10, 0, true, items2);

                expect(getStringOfIds(partialItems)).toBe('0,1');

                // ----

                var items10 = [
                    {id: 0},
                    {id: 1},
                    {id: 2},
                    {id: 3},
                    {id: 4},
                    {id: 5},
                    {id: 6},
                    {id: 7},
                    {id: 8},
                    {id: 9}
                ];

                partialItems = getPartialItems(1, 5, 0, true, items10);

                expect(getStringOfIds(partialItems)).toBe('0,1,2,3,4,5,6,7,8,9');

                // ----

                partialItems = getPartialItems(0, 5, 0, false, items10);

                expect(getStringOfIds(partialItems)).toBe('8,9,0,1,2');

                // ----

                partialItems = getPartialItems(1, 5, 0, false, items10);

                expect(getStringOfIds(partialItems)).toBe('9,0,1,2,3');

                // ----

                partialItems = getPartialItems(1, 5, 2, false, items10);

                expect(getStringOfIds(partialItems)).toBe('7,8,9,0,1,2,3,4,5');
            });
        });

        describe('_getItemByIndex', function(){
            var getItemByIndex;

            beforeEach(function(){
                getItemByIndex = inst._getItemByIndex.bind(inst);

                // getItemByIndex(index, list, loop);
            });

            it('should return correct ', function() {
                var items, item;

                items = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                expect(getItemByIndex(0, items, true)).toBe('0');

                expect(getItemByIndex(9, items, true)).toBe('9');

                expect(getItemByIndex(-1, items, true)).toBe('9');

                expect(getItemByIndex(10, items, true)).toBe('0');

                expect(getItemByIndex(100, items, true)).toBe('0');

                expect(getItemByIndex(-100, items, true)).toBe('0');

            });
        });

    });

    describe('_addItems/_removeItems', function(){
        var inst;

        function getStringOfContent(list) {
            list = list || [];
            list = Array.prototype.slice.call(list, 0);

            var arr = list.map(function(item) {
                return utils.getElementText(item);
            });

            return arr.join(',');
        };

        beforeEach(function(){
            var elemStr =   '<div class="gallery_carousel">' +
                '<div class="list_holder">' +
                '<ul>' +
                '</ul>' +
                '</div>' +
                '</div>';

            var elem = createElement(elemStr);

            inst = new LazyCarousel(elem, {
                noInit: true
            });
            inst._getItemTemplate = function(item) {
                return '<li class="item" data-id="'+ item._id +'">'+ item.id +'</li>';
            };

        });
        afterEach(function(){

        });

        it('should add item into empty list', function() {

            spyOn(inst, '_addItemPost').and.callThrough();

            inst.init();

            expect(inst.$list.firstChild).toBe(null);
            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            expect(inst._addItemPost).not.toHaveBeenCalled();

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.firstChild).not.toBe(null);
            expect(inst._$partialItems.length).toBe(3);
            expect(getStringOfContent(inst.$list.children)).toBe('1,2,3');
        });

        it('should append item into not empty list', function() {

            spyOn(inst, '_addItemPost').and.callThrough();

            inst.init();

            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(3);
            expect(inst._$partialItems.length).toBe(3);

            expect(inst._addItemPost).toHaveBeenCalled();
            expect(inst._addItemPost.calls.count()).toBe(3);

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3},
                {id: 4},
                {id: 5}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(5);
            expect(inst._$partialItems.length).toBe(5);

            expect(inst._addItemPost.calls.count()).toBe(5);

            inst._addItems();

            expect(inst.$list.children.length).toBe(5);
            expect(inst._$partialItems.length).toBe(5);
            expect(inst._addItemPost.calls.count()).toBe(5);
            expect(getStringOfContent(inst.$list.children)).toBe('1,2,3,4,5');
        });

        it('should prepend item into not empty list', function() {

            spyOn(inst, '_addItemPost').and.callThrough();

            inst.init();

            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(3);
            expect(inst._$partialItems.length).toBe(3);

            expect(inst._addItemPost).toHaveBeenCalled();
            expect(inst._addItemPost.calls.count()).toBe(3);

            inst._partialItems = [
                {id: -1},
                {id: 0},
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(5);
            expect(inst._$partialItems.length).toBe(5);

            expect(inst._addItemPost.calls.count()).toBe(5);

            inst._addItems();

            expect(inst.$list.children.length).toBe(5);
            expect(inst._$partialItems.length).toBe(5);
            expect(inst._addItemPost.calls.count()).toBe(5);
            expect(getStringOfContent(inst.$list.children)).toBe('-1,0,1,2,3');
        });

        it('should prepend/append item into not empty list', function() {

            spyOn(inst, '_addItemPost').and.callThrough();

            inst.init();

            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(3);
            expect(inst._$partialItems.length).toBe(3);

            expect(inst._addItemPost).toHaveBeenCalled();
            expect(inst._addItemPost.calls.count()).toBe(3);

            inst._partialItems = [
                {id: 0},
                {id: 1},
                {id: 2},
                {id: 3},
                {id: 4}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(5);
            expect(inst._$partialItems.length).toBe(5);

            expect(inst._addItemPost.calls.count()).toBe(5);

            inst._addItems();

            expect(inst.$list.children.length).toBe(5);
            expect(inst._$partialItems.length).toBe(5);
            expect(inst._addItemPost.calls.count()).toBe(5);
            expect(getStringOfContent(inst.$list.children)).toBe('0,1,2,3,4');
        });

        it('should remove empty list', function() {

            spyOn(inst, '_removeItemPost').and.callThrough();

            inst.init();

            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            inst._removeItems();

            expect(inst._removeItemPost).not.toHaveBeenCalled();

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(3);
            expect(inst._$partialItems.length).toBe(3);

            inst._partialItems = [];

            inst._removeItems();

            expect(inst._removeItemPost).toHaveBeenCalled();
            expect(inst._removeItemPost.calls.count()).toBe(3);

            expect(inst.$list.children.length).toBe(0);
            expect(inst._$partialItems.length).toBe(0);
        });

        it('should remove at the start of not empty list', function() {

            spyOn(inst, '_removeItemPost').and.callThrough();

            inst.init();

            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(3);
            expect(inst._$partialItems.length).toBe(3);

            inst._partialItems = [
                {id: 2},
                {id: 3}
            ];

            inst._removeItems();

            expect(inst._removeItemPost).toHaveBeenCalled();
            expect(inst._removeItemPost.calls.count()).toBe(1);

            expect(inst.$list.children.length).toBe(2);
            expect(inst._$partialItems.length).toBe(2);
            expect(getStringOfContent(inst.$list.children)).toBe('2,3');

        });

        it('should remove at the end of not empty list', function() {

            spyOn(inst, '_removeItemPost').and.callThrough();

            inst.init();

            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(3);
            expect(inst._$partialItems.length).toBe(3);

            inst._partialItems = [
                {id: 1},
                {id: 2}
            ];

            inst._removeItems();

            expect(inst._removeItemPost).toHaveBeenCalled();
            expect(inst._removeItemPost.calls.count()).toBe(1);

            expect(inst.$list.children.length).toBe(2);
            expect(inst._$partialItems.length).toBe(2);

            var item1 = inst.$list.children[0];
            var item2 = inst.$list.children[1];

            expect(item1.getAttribute('data-id')).toBe('1');
            expect(item2.getAttribute('data-id')).toBe('2');
        });

        it('should remove at the start/end of not empty list', function() {

            spyOn(inst, '_removeItemPost').and.callThrough();

            inst.init();

            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(3);
            expect(inst._$partialItems.length).toBe(3);

            inst._partialItems = [
                {id: 2}
            ];

            inst._removeItems();

            expect(inst._removeItemPost).toHaveBeenCalled();
            expect(inst._removeItemPost.calls.count()).toBe(2);

            expect(inst.$list.children.length).toBe(1);
            expect(inst._$partialItems.length).toBe(1);

            var item2 = inst.$list.children[0];

            expect(item2.getAttribute('data-id')).toBe('2');
        });

        it('should force remove all items', function() {

            spyOn(inst, '_removeItemPost').and.callThrough();

            inst.init();

            expect(inst._$partialItems.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);

            inst._partialItems = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst._addItems();

            expect(inst.$list.children.length).toBe(3);
            expect(inst._$partialItems.length).toBe(3);

            inst._partialItems = [
                {id: 2}
            ];

            inst._removeItems(true);

            expect(inst._removeItemPost).toHaveBeenCalled();
            expect(inst._removeItemPost.calls.count()).toBe(3);

            expect(inst.$list.children.length).toBe(0);
            expect(inst._$partialItems.length).toBe(0);
        });

    });

    describe('_centerList', function() {
        var inst;

        function applyOptions(inst, holderWidth, itemWidth, active, count) {
            inst._holderWidth = holderWidth;
            inst._itemWidth = itemWidth;

            inst._active = active;
            inst._count = count;
        };

        beforeEach(function (gCarousel) {
            var elemStr = '<div class="gallery_carousel">' +
                '<div class="list_holder">' +
                '<ul>' +
                    '<li class="item" style="width: 100px;"></li>'
                '</ul>' +
                '</div>' +
                '</div>';

            var elem = createElement(elemStr);

            inst = new LazyCarousel(elem, {
                noInit: true
            });
        });
        afterEach(function () {

        });

        it('should center without nav', function () {
            var holderWidth, itemWidth, active, count;

            inst.init();

            holderWidth = 1000;
            itemWidth = 100;

            active = 0;
            count = 4;

            applyOptions(inst, holderWidth, itemWidth, active, count);

            inst.resize(false, itemWidth, holderWidth);

            expect(inst._visible).toBe(11);
            expect(inst._addition).toBe(0);
            expect(inst._hasNav).toBe(false);

            inst._centerList();

            expect(inst._offsetLeft).toBe((holderWidth/2 - itemWidth/2) - (active) * itemWidth);

            // ----

            holderWidth = 1000;
            itemWidth = 100;

            active = 1;
            count = 4;

            applyOptions(inst, holderWidth, itemWidth, active, count);

            inst.resize(false, itemWidth, holderWidth);

            expect(inst._visible).toBe(11);
            expect(inst._addition).toBe(0);
            expect(inst._hasNav).toBe(false);

            inst._centerList();

            expect(inst._offsetLeft).toBe(350);

            // ----

            holderWidth = 1000;
            itemWidth = 100;

            active = 9;
            count = 4;

            applyOptions(inst, holderWidth, itemWidth, active, count);

            inst.resize(false, itemWidth, holderWidth);

            expect(inst._visible).toBe(11);
            expect(inst._addition).toBe(0);
            expect(inst._hasNav).toBe(false);

            inst._centerList();

            expect(inst._offsetLeft).toBe(-450);

            // ----

            holderWidth = 1000;
            itemWidth = 100;

            active = 11;
            count = 4;

            applyOptions(inst, holderWidth, itemWidth, active, count);

            inst.resize(false, itemWidth, holderWidth);

            expect(inst._visible).toBe(11);
            expect(inst._addition).toBe(0);
            expect(inst._hasNav).toBe(false);

            inst._centerList();

            expect(inst._offsetLeft).toBe(-650);
        });

        it('should center with nav', function () {
            var holderWidth, itemWidth, active, count;

            inst.init();

            holderWidth = 1000;
            itemWidth = 250;

            active = 0;
            count = 10;

            applyOptions(inst, holderWidth, itemWidth, active, count);

            inst.resize(false, itemWidth, holderWidth);

            expect(inst._visible).toBe(5);
            expect(inst._addition).toBe(0);
            expect(inst._hasNav).toBe(true);

            inst._centerList();

            expect(inst._offsetLeft).toBe(-125);

            // ----


        });

    });

    describe('updateItems', function(){
        var inst;

        function getStringOfContent(list) {
            list = list || [];
            list = Array.prototype.slice.call(list, 0);

            var arr = list.map(function(item) {
                return utils.getElementText(item);
            });

            return arr.join(',');
        };

        beforeEach(function(){
           var elemStr =   '<div class="gallery_carousel">' +
                                '<div class="list_holder">' +
                                    '<ul>' +
                                    '</ul>' +
                                '</div>' +
                            '</div>';

            var elem = createElement(elemStr);

            inst = new LazyCarousel(elem, {
                noInit: true
            });
            inst._getItemTemplate = function(item) {
                return '<li class="item" data-id="'+ item._id +'">'+ item.id +'</li>';
            };

        });
        afterEach(function(){

        });

        it('should not call _updateVisible if no items', function() {
            spyOn(inst, '_updateVisible').and.callThrough();

            inst._active = 0;
            inst._visible = 1;

            inst.init();

            expect(inst._updateVisible).not.toHaveBeenCalled();

            expect(inst.items.length).toBe(0);
            expect(inst.$list.children.length).toBe(0);
            expect(inst._$partialItems.length).toBe(0);
        });

        it('should not call _updateVisible if items', function() {
            spyOn(inst, '_updateVisible').and.callThrough();

            inst._active = 0;

            // visible is set in resize();
            //inst._visible = 1;

            inst.items = [
                {id: 1},
                {id: 2},
                {id: 3}
            ];

            inst.init();

            expect(inst._updateVisible).toHaveBeenCalled();

            expect(inst.items.length).toBe(3);
            expect(inst.$list.children.length).not.toBe(0);
            expect(inst._$partialItems.length).not.toBe(0);
        });

        it('should add items into empty list with nav', function() {
            spyOn(inst, '_updateVisible').and.callThrough();

            inst.init();

            expect(inst.items.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);
            expect(inst.$list.children.length).toBe(0);
            expect(inst._$partialItems.length).toBe(0);

            expect(inst._updateVisible).not.toHaveBeenCalled();

            inst._itemWidth = 200;
            inst._holderWidth = 1000;

            inst.updateItems([
                {id: 1},
                {id: 2},
                {id: 3}
            ]);

            expect(inst._isSimple).toBe(true);
            expect(inst._updateVisible).toHaveBeenCalled();
            expect(inst._updateVisible.calls.count()).toBe(1);

            expect(inst._$partialItems.length).toBe(3);
            expect(getStringOfContent(inst.$list.children)).toBe('1,2,3');
        });

        it('should add items into empty list with no nav', function() {
            spyOn(inst, '_updateVisible').and.callThrough();

            inst.init();

            expect(inst.items.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);
            expect(inst.$list.children.length).toBe(0);
            expect(inst._$partialItems.length).toBe(0);

            expect(inst._updateVisible).not.toHaveBeenCalled();

            inst._itemWidth = 200;
            inst._holderWidth = 1000;

            inst.updateItems([
                {id: 1}
            ]);

            expect(inst._isSimple).toBe(true);
            expect(inst._updateVisible).toHaveBeenCalled();
            expect(inst._updateVisible.calls.count()).toBe(1);

            expect(inst._$partialItems.length).toBe(1);

            expect(getStringOfContent(inst.$list.children)).toBe('1');
        });

        it('should update items with no nav', function() {
            spyOn(inst, '_updateVisible').and.callThrough();

            inst.init();

            expect(inst.items.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);
            expect(inst.$list.children.length).toBe(0);
            expect(inst._$partialItems.length).toBe(0);

            expect(inst._updateVisible).not.toHaveBeenCalled();

            inst._itemWidth = 200;
            inst._holderWidth = 1000;

            inst.updateItems([
                {id: 1}
            ]);

            expect(inst._isSimple).toBe(true);
            expect(inst._updateVisible).toHaveBeenCalled();
            expect(inst._updateVisible.calls.count()).toBe(1);

            expect(getStringOfContent(inst.$list.children)).toBe('1');

            inst.updateItems([
                {id: 1},
                {id: 2}
            ]);

            expect(inst._isSimple).toBe(true);
            expect(inst._updateVisible.calls.count()).toBe(2);

            expect(getStringOfContent(inst.$list.children)).toBe('1,2');

            inst.updateItems([
                {id: 2}
            ]);

            expect(inst._isSimple).toBe(true);
            expect(inst._updateVisible.calls.count()).toBe(3);

            expect(getStringOfContent(inst.$list.children)).toBe('2');
        });


        it('should update items with nav', function() {
            spyOn(inst, '_updateVisible').and.callThrough();

            inst.init();

            expect(inst.items.length).toBe(0);
            expect(inst._partialItems.length).toBe(0);
            expect(inst.$list.children.length).toBe(0);
            expect(inst._$partialItems.length).toBe(0);

            expect(inst._updateVisible).not.toHaveBeenCalled();

            inst._itemWidth = 300;
            inst._holderWidth = 1000;

            inst.updateItems([
                {id: 1},
                {id: 2},
                {id: 3},
                {id: 4},
                {id: 5}
            ]);

            expect(inst._isSimple).toBe(false);
            expect(inst._updateVisible).toHaveBeenCalled();
            expect(inst._updateVisible.calls.count()).toBe(1);

            expect(getStringOfContent(inst.$list.children)).toBe('3,4,5,1,2,3,4');

            inst.updateItems([
                {id: 1},
                {id: 2},
                {id: 3},
                {id: 4},
                {id: 5},
                {id: 6},
                {id: 7}
            ]);

            expect(inst._isSimple).toBe(false);
            expect(inst._updateVisible).toHaveBeenCalled();
            expect(inst._updateVisible.calls.count()).toBe(2);

            expect(getStringOfContent(inst.$list.children)).toBe('5,6,7,1,2,3,4');

            inst.updateItems([
                {id: -1},
                {id: 0},
                {id: 1},
                {id: 2},
                {id: 3},
                {id: 4},
                {id: 5},
                {id: 6},
                {id: 7}
            ]);

            expect(inst._isSimple).toBe(false);
            expect(inst._updateVisible).toHaveBeenCalled();
            expect(inst._updateVisible.calls.count()).toBe(3);

            expect(getStringOfContent(inst.$list.children)).toBe('5,6,7,-1,0,1,2');

            inst.updateItems([
                {id: 1},
                {id: 2},
                {id: 3}
            ]);

            expect(inst._isSimple).toBe(true);
            expect(inst._updateVisible).toHaveBeenCalled();
            expect(inst._updateVisible.calls.count()).toBe(4);

            expect(getStringOfContent(inst.$list.children)).toBe('1,2,3');
        });
    });

});