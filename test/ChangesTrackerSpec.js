import utils from  'my-utils';
import ChangesTracker from '../src/ChangesTracker.js';

describe('ChangesTracker', function() {

    function createInstance(elem, opts) {
        var inst = new ChangesTracker(elem);
        inst.init();
        return inst;
    }

    it('should be defined', function() {
        expect(ChangesTracker).toBeDefined();
    });

    it('should be Class fn', function() {
        var elem = document.createElement('ul');
        var inst = createInstance(elem);

        expect(inst.$element).toBe(elem);
    });

    it('should clear existed nodes', function() {
        var elem = document.createElement('ul');
        elem.innerHTML = '<li/><li/>';

        expect(elem.children.length).toBe(2);

        var inst = createInstance(elem);

        expect(elem.children.length).toBe(0);
    });

    it('should insert start comment', function() {
        var elem = document.createElement('ul');

        expect(elem.childNodes.length).toBe(0);

        var inst = createInstance(elem);

        expect(elem.childNodes.length).toBe(1);
        expect(elem.firstChild).toBe(inst.$startComment);
    });

    it('should insert item ', function() {
        var elem = document.createElement('ul');

        var inst = createInstance(elem);

        inst.updateList([
            {id: 1, name: 'Yura'}
        ]);

        expect(elem.children.length).toBe(1);
    });

    it('should remove item ', function() {
        var elem = document.createElement('ul');

        var inst = createInstance(elem);

        inst.updateList([
            {id: 1, name: 'Yura'}
        ]);

        expect(elem.children.length).toBe(1);

        inst.updateList([]);

        expect(elem.children.length).toBe(0);
    });


    it('should add item only once', function() {
        var elem = document.createElement('ul');

        var inst = createInstance(elem);

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

        var inst = createInstance(elem);

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

        str = utils.getElementText(elem);

        expect(str).toBe('21');
    });

    it('should work correct', function() {
        var elem = document.createElement('ul');

        var inst = createInstance(elem);

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

        str = utils.getElementText(elem);

        expect(str).toBe('12345');

    });
});
