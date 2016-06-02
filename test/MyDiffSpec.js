var utils = window.utils;
var reconcile = window.reconcile;
var diff = reconcile.diff;
var arraysDiff = utils.arraysDiff;
var domListPatch = utils.domListPatch;

describe('diff', function(){

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
        var curr = utils.createElement('<ul><li id="5">5</li><li id="2">2</li><li id="3">3</li><li id="4">4</li><li id="1">1</li></ul>');

        //console.log('base', '<ul><li id="1">1</li><li id="2">2</li></ul>');
        //console.log('curr', '<ul><li id="2">2</li><li id="1">1</li></ul>');
        console.log('origin');
        var res = diff(curr, base);
        console.log('result');
        console.log(res);
    });

});

describe('arraysDiff', function(){

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

    fit('patch dom', function() {
        var list = document.createElement('ul');
        list.innerHTML = '<li>1</li><li>3</li><li>5</li>'; // <li>5</li>

        var base = [
            {id: 1},
            {id: 3},
            {id: 5}
        ];
        var curr = [
            {id: 5},
            {id: 2},
            {id: 3},
            {id: 4},
            {id: 1}
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
            cb();
        }

        function afterRemove(element, $item) {

        }

        domListPatch(list, res, beforeAdd, afterAdd, beforeRemove, afterRemove);

        console.log(res);
        console.log(list);
    });
});