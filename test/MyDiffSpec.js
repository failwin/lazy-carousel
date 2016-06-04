var utils = window.utils;
var reconcile = window.reconcile;
var diff = reconcile.diff;
var apply = reconcile.apply;

var arraysDiff = utils.arraysDiff.bind(utils);
var domListPatch = utils.domListPatch.bind(utils);
var updateList = utils.updateList.bind(utils);

var ChangesTracker = window.ChangesTracker;

xdescribe('diff', function(){

    beforeEach(function() {

    });
    afterEach(function() {

    });

    it('should be defined', function() {
        expect(reconcile).toBeDefined();
        expect(diff).toBeDefined();
    });

    it('removeChildElement', function() {
        var base = utils.createElement('<ul><li>1</li><li>2</li><li>3</li></ul>');
        var curr = utils.createElement('<ul><li>1</li><li>2</li></ul>');

        console.log('base', '<ul><li>1</li><li>2</li><li>3</li></ul>');
        console.log('curr', '<ul><li>1</li><li>2</li></ul>');

        console.log('\n');
        var res = diff(curr, base);

        console.log('\n');
        console.log(res);
    });

    it('insertChildElement', function() {
        var base = utils.createElement('<ul><li>1</li><li>2</li></ul>');
        var curr = utils.createElement('<ul><li>1</li><li>2</li><li>3</li></ul>');

        console.log('base', '<ul><li>1</li><li>2</li></ul>');
        console.log('curr', '<ul><li>1</li><li>2</li><li>3</li></ul>');

        console.log('\n');
        var res = diff(curr, base);

        console.log('\n');
        console.log(res);
    });

    it('moveChildElement', function() {
        var base = utils.createElement('<ul><li id="1">1</li><li id="2">2</li></ul>');
        var curr = utils.createElement('<ul><li id="2">2</li><li id="1">1</li></ul>');

        console.log('base', '<ul><li id="1">1</li><li id="2">2</li></ul>');
        console.log('curr', '<ul><li id="2">2</li><li id="1">1</li></ul>');

        console.log('\n');
        var res = diff(curr, base);

        console.log('\n');
        console.log(res);
    });

    it('complex', function() {
        var base = utils.createElement('<ul><li id="1">1</li><li id="3">3</li><li id="5">5</li></ul>');
        var curr = utils.createElement('<ul><li id="1">1</li><li id="2">2</li><li id="3">3</li><li id="4">4</li><li id="5">5</li></ul>');

        //console.log('base', '<ul><li id="1">1</li><li id="2">2</li></ul>');
        //console.log('curr', '<ul><li id="2">2</li><li id="1">1</li></ul>');
        console.log('origin');
        var res = diff(curr, base);
        console.log('result');
        console.log(res);

        console.log(base);

        apply(res, base);

        console.log(base);
    });

});

xdescribe('arraysDiff', function(){

    beforeEach(function() {

    });
    afterEach(function() {

    });

    it('should be defined', function() {
        expect(reconcile).toBeDefined();
        expect(diff).toBeDefined();
    });

    it('removeChildElement', function() {
        var base = [
            {id: 1},
            {id: 2},
            {id: 3}
        ];
        var curr = [
            {id: 1},
            {id: 2}
        ];

        var res = arraysDiff(base, curr);

        console.log(res);
    });

    it('insertChildElement', function() {
        var base = [
            {id: 1},
            {id: 2}
        ];
        var curr = [
            {id: 1},
            {id: 2},
            {id: 3}
        ];

        var res = arraysDiff(base, curr);

        console.log(res);
    });

    it('moveChildElement', function() {
        var base = [
            {id: 1},
            {id: 2}
        ];
        var curr = [
            {id: 2},
            {id: 1},
            {id: 3}
        ];

        var res = arraysDiff(base, curr);

        console.log(res);
    });

    it('insertChildElement into empty arr', function() {
        var base = [];
        var curr = [
            {id: 1},
            {id: 2}
        ];

        var res = arraysDiff(base, curr);

        console.log(res);
    });

    it('patch dom', function() {
        var list = document.createElement('ul');
        list.innerHTML = '<li>1</li><li>2</li><li>3</li><li>4</li><li>5</li>'; // <li>5</li>

        var base = [
            {id: 1},
            {id: 2},
            {id: 3},
            {id: 4},
            {id: 5}
        ];
        var curr = [
            {id: 2},
            {id: 3},
            {id: 4},
            {id: 5}
        ];

        console.log('our');

        var res = arraysDiff(base, curr);

        function beforeAdd(element, cb) {
            var template = '<li>'+ element.id +'</li>';
            cb(template);
        }

        function afterAdd(element, $item) {

        }

        function beforeRemove(element, $item, cb) {
            cb($item);
        }

        function afterRemove(element, $item) {

        }

        domListPatch(list, res, beforeAdd, afterAdd, beforeRemove, afterRemove);

        console.log(res);
        console.log(list);
    });
});

xdescribe('angular ngRepeat', function(){
    var $compile, $rootScope;

    beforeEach(function() {
        inject(function(_$compile_, _$rootScope_){
            $compile = _$compile_;
            $rootScope = _$rootScope_;//.$new();
        });
    });
    afterEach(function() {

    });

    xit('bla', function() {
        expect($compile).toBeDefined();

        var element = angular.element('<ul><li ng-repeat="model in collection track by model.id">{{model.id}}</li></ul>');
        var compiledElement = $compile(element)($rootScope);

        $rootScope.collection = [
            {id: 1},
            {id: 2},
            {id: 3}
        ];

        $rootScope.$digest();

        //console.log(compiledElement);


        angular.element(document.body).append(compiledElement);
    });

    it('bla 2', function() {
        var list = document.createElement('ul');
        list.innerHTML = '<li>1</li><li>2</li><li>3</li>';

        var base = [
            {id: 1},
            {id: 2},
            {id: 3}
        ];
        var current = [
            {id: 3},
            {id: 2},
            {id: 1}
        ];


        updateList(list, base, current);

        console.log(list);
    });

    xit('utils.insertBefore', function() {
        var insertBefore = utils.insertBefore;

        var list = document.createElement('ul');
        list.innerHTML = '<li>1</li><li>2</li><li>3</li><li>4</li><li>5</li>';

        var elem = utils.createElement('<li>INSERTED</li>');

        //utils.insertBefore

        var inserted = utils.insertBefore(list, elem, 10);

        expect(list.children[5]).toBe(inserted);

        console.log(list);
    });
});

fdescribe('ChangesTracker', function() {

    it('should be defined', function() {
        expect(ChangesTracker).toBeDefined();
    });

    it('should be Class fn', function() {
        var elem = document.createElement('ul');
        var inst = new ChangesTracker(elem);

        expect(inst.$element).toBe(elem);
    });

    it('should clear existed nodes', function() {
        var elem = document.createElement('ul');
        elem.innerHTML = '<li/><li/>';

        expect(elem.children.length).toBe(2);

        var inst = new ChangesTracker(elem);

        expect(elem.children.length).toBe(0);
    });

    it('should insert start comment', function() {
        var elem = document.createElement('ul');

        expect(elem.childNodes.length).toBe(0);

        var inst = new ChangesTracker(elem);

        expect(elem.childNodes.length).toBe(1);
        expect(elem.firstChild).toBe(inst.$startComment);
    });

    it('should insert item ', function() {
        var elem = document.createElement('ul');

        var inst = new ChangesTracker(elem);

        inst.updateList([
            {id: 1, name: 'Yura'}
        ]);

        expect(elem.children.length).toBe(1);
    });

    it('should remove item ', function() {
        var elem = document.createElement('ul');

        var inst = new ChangesTracker(elem);

        inst.updateList([
            {id: 1, name: 'Yura'}
        ]);

        expect(elem.children.length).toBe(1);

        inst.updateList([]);

        expect(elem.children.length).toBe(0);
    });


    it('should add item only once', function() {
        var elem = document.createElement('ul');

        var inst = new ChangesTracker(elem);

        var beforeAddSpy = spyOn(inst.opts, 'beforeAdd').and.callThrough();

        inst.updateList([
            {id: 1}
        ]);

        expect(elem.children.length).toBe(1);
        expect(beforeAddSpy.calls.count()).toBe(1);

        inst.updateList([
            {id: 1}
        ]);

        expect(elem.children.length).toBe(1);
        expect(beforeAddSpy.calls.count()).toBe(1);

        inst.updateList([
            {id: 2},
            {id: 1}
        ]);

        expect(elem.children.length).toBe(2);
        expect(beforeAddSpy.calls.count()).toBe(2);
    });

    it('should do not add/remove items if they are the same but has different location', function() {
        var elem = document.createElement('ul');

        var inst = new ChangesTracker(elem);

        var beforeAddSpy = spyOn(inst.opts, 'beforeAdd').and.callThrough();
        var beforeRemoveSpy = spyOn(inst.opts, 'beforeRemove').and.callThrough();

        inst.updateList([
            {id: 1},
            {id: 2}
        ]);

        expect(elem.children.length).toBe(2);
        expect(beforeAddSpy.calls.count()).toBe(2);
        expect(beforeRemoveSpy.calls.count()).toBe(0);

        var str = utils.getElementText(elem);

        expect(str).toBe('12');

        inst.updateList([
            {id: 2},
            {id: 1}
        ]);

        expect(elem.children.length).toBe(2);
        expect(beforeAddSpy.calls.count()).toBe(2);
        expect(beforeRemoveSpy.calls.count()).toBe(0);

        var str = utils.getElementText(elem);

        expect(str).toBe('21');
    });

    it('should work correct', function() {
        var elem = document.createElement('ul');

        var inst = new ChangesTracker(elem);

        var beforeAddSpy = spyOn(inst.opts, 'beforeAdd').and.callThrough();
        var beforeRemoveSpy = spyOn(inst.opts, 'beforeRemove').and.callThrough();

        inst.updateList([
            {id: 5},
            {id: 3},
            {id: 1}
        ]);

        var str = utils.getElementText(elem);

        expect(str).toBe('531');

        beforeAddSpy.calls.reset();
        beforeRemoveSpy.calls.reset();

        inst.updateList([
            {id: 1},
            {id: 2},
            {id: 3},
            {id: 4},
            {id: 5}
        ]);

        expect(beforeAddSpy.calls.count()).toBe(2);
        expect(beforeRemoveSpy.calls.count()).toBe(0);

        var str = utils.getElementText(elem);

        expect(str).toBe('12345');

    });
});
