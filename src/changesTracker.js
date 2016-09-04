var NG_REMOVED = '$$MY_NG_REMOVED';

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

function domInsert(element, parentElement, afterElement) {
    // if for some reason the previous element was removed
    // from the dom sometime before this code runs then let's
    // just stick to using the parent element as the anchor

    var parent = parentElement || afterElement.parentNode;

    if (afterElement) {
        if (afterElement && !afterElement.parentNode && !afterElement.previousElementSibling) {
            afterElement = null;
        }
    }

    element = createElement(element);

    if (afterElement) {
        afterElement.parentNode.insertBefore(element, afterElement.nextSibling);

        //after(afterElement, element);
    }
    else {

        parent.insertBefore(element, parent.firstChild);

        //prepend(parent, element);
    }

    //afterElement ? afterElement.after(element) : parentElement.prepend(element);
}

var ChangesTracker = (function() {
    function ChangesTracker(element, opts) {
        this.opts = extend({}, this.defOpts);
        this.opts = extend(this.opts, opts);

        this.$element = element;

        this.$startComment = null;

        this.lastBlockMap = null;

        this.init();
    }

    ChangesTracker.prototype.defOpts = {
        debug: false,
        trackById: 'id',
        trackByIdFn: function(key, value, index, trackById) {
            return value[trackById];
        },
        beforeAdd: function(data, callback) {
            callback = callback || function() {};

            var elem = createElement('<li>'+ data.id +'</li>');

            callback(elem);
        },
        afterAdd: function(data, element){},
        beforeRemove: function(data, element, callback) {
            callback = callback || function () {};

            callback();
        },
        afterRemove: function(data) {}
    };

    ChangesTracker.prototype.init = function() {
        // clear
        while (this.$element.firstChild) {
            this.$element.removeChild(this.$element.firstChild);
        }

        // insert first anchor
        this.$startComment = window.document.createComment('');
        this.$element.appendChild(this.$startComment);

        this.lastBlockMap = Object.create(null);
    };

    ChangesTracker.prototype.updateList = function(collection) {
        var previousNode =  this.$startComment,
            nextNode,
            nextBlockMap = Object.create(null),
            nextBlockOrder,
            collectionLength,
            index, key, value,
            trackById,
            block,
            removed = [];

        collectionLength = collection.length;
        nextBlockOrder = new Array(collectionLength);

        // locate existing items
        for (index = 0; index < collectionLength; index++) {
            key = index;
            value = collection[key];
            trackById = this.opts.trackByIdFn(key, value, index, this.opts.trackById);
            if (this.lastBlockMap[trackById]) {
                // found previously seen block
                block = this.lastBlockMap[trackById];
                delete this.lastBlockMap[trackById];
                nextBlockMap[trackById] = block;
                nextBlockOrder[index] = block;
            } else if (nextBlockMap[trackById]) {
                // if collision detected. restore lastBlockMap and throw an error
                nextBlockOrder.forEach(function(block) {
                    if (block && block.data) {
                        this.lastBlockMap[block.id] = block;
                    }
                }.bind(this));
                throw new Error('Duplicates in a repeater are not allowed');
            } else {
                // new never before seen block
                nextBlockOrder[index] = {id: trackById, data: undefined, element: undefined};
                nextBlockMap[trackById] = true;
            }
        }

        // remove leftover items
        for (var blockKey in this.lastBlockMap) {
            if (!this.lastBlockMap.hasOwnProperty(blockKey)) {
                continue;
            }
            block = this.lastBlockMap[blockKey];

            //$animate.leave(elementsToRemove);
            removed.push(block);

            if (block.element.parentNode) {
                // if the element was not removed yet because of pending animation, mark it as deleted
                // so that we can ignore it later
                block.element[NG_REMOVED] = true;
            }
        }

        // moving/inserting
        for (index = 0; index < collectionLength; index++) {
            key = index;
            value = collection[key];
            block = nextBlockOrder[index];

            if (block.data) {
                // if we have already seen this object
                nextNode = previousNode;

                // skip nodes that are already pending removal via leave animation
                do {
                    nextNode = nextNode.nextSibling;
                } while (nextNode && nextNode[NG_REMOVED]);

                if (block.element !== nextNode) {
                    // existing item which got moved

                    // $animate.move(getBlockNodes(block.clone), null, previousNode);
                    domInsert(block.element, null, previousNode);
                }
                previousNode = block.element;
            } else {
                // new item which we don't know about
                block.data = value;

                /*eslint-disable */
                this.opts.beforeAdd(block.data, function(elem) {
                /*eslint-enable */
                    // $animate.enter(clone, null, previousNode);
                    domInsert(elem, null, previousNode);

                    this.opts.afterAdd(block.data, elem);

                    previousNode = elem;

                    block.element = elem;
                    nextBlockMap[block.id] = block;
                }.bind(this));
            }
        }
        this.lastBlockMap = nextBlockMap;

        // real removing
        for (var i = 0, l = removed.length; i < l; i++) {
            block = removed[i];
            /*eslint-disable */
            this.opts.beforeRemove(block.data, block.element, function(){
            /*eslint-enable */
                this.$element.removeChild(block.element);
                this.opts.afterRemove(block.data);
                block = block.data = block.element = null;
            }.bind(this));
        }
        removed = null;
    };

    return ChangesTracker;
})();

export default ChangesTracker;