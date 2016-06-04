(function(window, document, undefined){
'use strict';

// Module
var NG_REMOVED = '$$MY_NG_REMOVED';
var ELEMENT_NODE = 1;

function isArray(obj) {
    if (Array.isArray) {
        return Array.isArray(obj);
    }
    return Object.prototype.toString.call(obj) === '[object Array]';
}
function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
}
function isString(obj) {
    var type = typeof obj;
    return type === 'string' && !!obj;
}
function isFunction(obj) {
    return Object.prototype.toString.call(obj) === '[object ' + name + ']';
}

function extend(obj, prop, isDeep) {
    var src, copyIsArray, copy, name, clone,
        target = obj || {},
        i = 1,
        length = arguments.length,
        deep = isDeep,
        options = prop;

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !isFunction(target) ) {
        target = {};
    }

    for ( name in options ) {
        if (prop.hasOwnProperty(name)) {
            src = target[ name ];
            copy = options[ name ];

            // Prevent never-ending loop
            if ( target === copy ) {
                continue;
            }

            // Recurse if we're merging plain objects or arrays
            if ( deep && copy && (copyIsArray = isArray(copy)) ) {
                if ( copyIsArray ) {
                    copyIsArray = false;
                    clone = src && isArray(src) ? src : [];

                } else {
                    clone = src ? src : {};
                }

                // Never move original objects, clone them
                target[ name ] = extend( clone, copy, deep );

                // Don't bring in undefined values
            } else if ( copy !== undefined ) {
                target[ name ] = copy;
            }
        }
    }

    return target;
}

function createMap() {
    return Object.create(null);
}

function createComment(directiveName, comment, debug) {
    var content = '';
    if (debug) {
        content = ' ' + (directiveName || '') + ': ';
        if (comment) content += comment + ' ';
    }
    return window.document.createComment(content);
}

function createElement(str) {
    if (isObject(str)) {
        return str;
    }
    var frag = document.createDocumentFragment();

    var elem = document.createElement('div');
    elem.innerHTML = str;

    while (elem.childNodes[0]) {
        frag.appendChild(elem.childNodes[0]);
    }
    return frag.childNodes[0];
}
function after(element, newElement) {
    var index = element, parent = element.parentNode;

    for (var i = 0, ii = newElement.length; i < ii; i++) {
        var node = newElement[i];
        parent.insertBefore(node, index.nextSibling);
        index = node;
    }
}
function prepend(element, node) {
    if (element.nodeType === ELEMENT_NODE) {
        var index = element.firstChild;
        forEach(node, function(child) {
            element.insertBefore(child, index);
        });
    }
}

function trackByIdFn(key, value, index, trackById) {
    return value[trackById];
}

function getBlockStart(block) {
    return block.clone[0];
}

function getBlockEnd(block) {
    return block.clone[block.clone.length - 1];
}

function extractElementNode(element) {
    for (var i = 0; i < element.length; i++) {
        var elm = element[i];
        if (elm && elm.nodeType === ELEMENT_NODE) {
            return elm;
        }
    }
}

function domInsert(element, parentElement, afterElement) {
    // if for some reason the previous element was removed
    // from the dom sometime before this code runs then let's
    // just stick to using the parent element as the anchor

    var parent = parentElement || afterElement.parentNode;

    if (afterElement) {
        var afterNode = extractElementNode(afterElement);
        if (afterNode && !afterNode.parentNode && !afterNode.previousElementSibling) {
            afterElement = null;
        }
    }

    element = createElement(element);

    if (afterElement) {
        after(afterElement, element);
    }
    else {
        prepend(parent, element);
    }

    //afterElement ? afterElement.after(element) : parentElement.prepend(element);
}

var ChangesTracker = (function() {
    function ChangesTracker(element, opts) {
        this.opts = extend({}, this.defOpts);
        this.opts = extend(this.opts, opts);

        this.$element = element;

        this.$startComment = null;
        this.$endComment = null;

        this.lastBlockMap = null;

        this.init();
    }

    ChangesTracker.prototype.defOpts = {
        debug: true,
        trackById: 'id',
        beforeAdd: function(block, callback) {
            callback = callback || function() {};

            //var elem = document.createElement('li');
            //elem.innerHTML = block.scope.id;
            var elem = createElement('<li>'+ block.scope.id +'</li>');

            callback(elem);
        },
        afterAdd: function(block, element){},
        beforeRemove: function(block, element, callback) {
            callback = callback || function () {};

            callback();
        },
        afterRemove: function(block) {}
    };

    ChangesTracker.prototype.init = function() {
        this.$startComment = createComment('start ngRepeat', null, this.opts.debug);
        this.$endComment = createComment('end ngRepeat', null, this.opts.debug);

        // clear
        while (this.$element.firstChild) {
            this.$element.removeChild(this.$element.firstChild);
        }

        this.$element.appendChild(this.$startComment);

        this.lastBlockMap = createMap();
    };

    ChangesTracker.prototype.updateList = function(collection) {
        var index, length,
            previousNode =  this.$startComment,
            nextNode,
            nextBlockMap = createMap(),
            collectionLength,
            key, value,
            trackById,
            collectionKeys,
            block,
            nextBlockOrder,
            elementsToRemove;

        collectionKeys = collection;
        collectionLength = collectionKeys.length;
        nextBlockOrder = new Array(collectionLength);

        var removes = [];

        // locate existing items
        for (index = 0; index < collectionLength; index++) {
            key = index;
            value = collection[key];
            trackById = trackByIdFn(key, value, index, this.opts.trackById);
            if (this.lastBlockMap[trackById]) {
                // found previously seen block
                block = this.lastBlockMap[trackById];
                delete this.lastBlockMap[trackById];
                nextBlockMap[trackById] = block;
                nextBlockOrder[index] = block;
            } else if (nextBlockMap[trackById]) {
                // if collision detected. restore lastBlockMap and throw an error
                forEach(nextBlockOrder, function(block) {
                    if (block && block.scope) {
                        this.lastBlockMap[block.id] = block;
                    }
                }, bind(this));
                throw new Error('Duplicates in a repeater are not allowed');
            } else {
                // new never before seen block
                nextBlockOrder[index] = {id: trackById, scope: undefined, clone: undefined};
                nextBlockMap[trackById] = true;
            }
        }

        // remove leftover items
        for (var blockKey in this.lastBlockMap) {
            block = this.lastBlockMap[blockKey];
            elementsToRemove = block.clone;

            //$animate.leave(elementsToRemove);
            removes.push(block);

            if (elementsToRemove[0].parentNode) {
                // if the element was not removed yet because of pending animation, mark it as deleted
                // so that we can ignore it later
                for (index = 0, length = elementsToRemove.length; index < length; index++) {
                    elementsToRemove[index][NG_REMOVED] = true;
                }
            }
            //block.scope.$destroy();
        }

        // we are not using forEach for perf reasons (trying to avoid #call)
        for (index = 0; index < collectionLength; index++) {
            key = index;
            value = collection[key];
            block = nextBlockOrder[index];

            if (block.scope) {
                // if we have already seen this object, then we need to reuse the
                // associated scope/element

                nextNode = previousNode;

                // skip nodes that are already pending removal via leave animation
                do {
                    nextNode = nextNode.nextSibling;
                } while (nextNode && nextNode[NG_REMOVED]);

                if (getBlockStart(block) != nextNode) {
                    // existing item which got moved

                    // $animate.move(getBlockNodes(block.clone), null, previousNode);
                    // move: function(element, parent, after, options) {
                    domInsert(block.clone, null, previousNode);
                }
                previousNode = getBlockEnd(block);
            } else {
                // new item which we don't know about
                block.scope = value;


                this.opts.beforeAdd(block, function(elem) {
                    var clone = [];
                    clone[0] = elem;
                    // http://jsperf.com/clone-vs-createcomment
                    var endNode = this.$endComment.cloneNode(false);
                    clone[1] = endNode;

                    // $animate.enter(clone, null, previousNode);
                    // enter: function(element, parent, after, options) {
                    domInsert(clone, null, previousNode);

                    this.opts.afterAdd(block, clone[0]);

                    previousNode = endNode;
                    // Note: We only need the first/last node of the cloned nodes.
                    // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                    // by a directive with templateUrl when its template arrives.
                    block.clone = clone;
                    nextBlockMap[block.id] = block;
                }.bind(this));
            }
        }
        this.lastBlockMap = nextBlockMap;

        // MY real removing
        for (var i = 0, l = removes.length; i < l; i++) {
            var block = removes[i];
            this.opts.beforeRemove(block, block.clone[0], function(){
                this.$element.removeChild(block.clone[0]);
                this.$element.removeChild(block.clone[1]);
                this.opts.afterRemove(block);
                block = block.scope = block.clone = block.clone[0] = block.clone[1] = null;
            }.bind(this));
        }
        removes = null;
    };

    return ChangesTracker;
})();

// Export
window.ChangesTracker = ChangesTracker;

})(window, document);

