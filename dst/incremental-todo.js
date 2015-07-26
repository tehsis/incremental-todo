(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @license
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var patch = require('./src/patch').patch;
var elements = require('./src/virtual_elements');

module.exports = {
  patch: patch,
  elementVoid: elements.elementVoid,
  elementOpenStart: elements.elementOpenStart,
  elementOpenEnd: elements.elementOpenEnd,
  elementOpen: elements.elementOpen,
  elementClose: elements.elementClose,
  text: elements.text,
  attr: elements.attr
};


},{"./src/patch":6,"./src/virtual_elements":9}],2:[function(require,module,exports){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var nodes = require('./nodes'),
    createNode = nodes.createNode,
    getKey = nodes.getKey,
    getNodeName = nodes.getNodeName,
    getChild = nodes.getChild,
    registerChild = nodes.registerChild;
var markVisited = require('./traversal').markVisited;
var getWalker = require('./walker').getWalker;


/**
 * Checks whether or not a given node matches the specified nodeName and key.
 *
 * @param {?Node} node An HTML node, typically an HTMLElement or Text.
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string} key An optional key that identifies a node.
 * @return {boolean} True if the node matches, false otherwise.
 */
var matches = function(node, nodeName, key) {
  return node &&
         key === getKey(node) &&
         nodeName === getNodeName(node);
};


/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 * @param {?string} nodeName For an Element, this should be a valid tag string.
 *     For a Text, this should be #text.
 * @param {?string} key The key used to identify this element.
 * @param {?Array<*>|string} statics For an Element, this should be an array of
 *     name-value pairs. For a Text, this should be the text content of the
 *     node.
 * @return {!Node} The matching node.
 */
var alignWithDOM = function(nodeName, key, statics) {
  var walker = getWalker();
  var currentNode = walker.currentNode;
  var parent = walker.getCurrentParent();
  var matchingNode;

  // Check to see if we have a node to reuse
  if (matches(currentNode, nodeName, key)) {
    matchingNode = currentNode;
  } else {
    var existingNode = key && getChild(parent, key);

    // Check to see if the node has moved within the parent or if a new one
    // should be created
    if (existingNode) {
      matchingNode = existingNode;
    } else {
      matchingNode = createNode(walker.doc, nodeName, key, statics);
      registerChild(parent, key, matchingNode);
    }

    parent.insertBefore(matchingNode, currentNode);
    walker.currentNode = matchingNode;
  }

  markVisited(parent, matchingNode);

  return matchingNode;
};


/** */
module.exports = {
  alignWithDOM: alignWithDOM
};


},{"./nodes":5,"./traversal":7,"./walker":10}],3:[function(require,module,exports){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var getData = require('./node_data').getData;


/**
 * Applies an attribute or property to a given Element. If the value is a object
 * or a function (which includes null), it is set as a property on the Element.
 * Otherwise, the value is set as an attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value. If the value is a string, it is set
 *     as an HTML attribute, otherwise, it is set on node.
 */
var applyAttr = function(el, name, value) {
  var data = getData(el);
  var attrs = data.attrs;

  if (attrs[name] === value) {
    return;
  }

  var type = typeof value;

  if (value === undefined) {
    el.removeAttribute(name);
  } else if (type === 'object' || type === 'function') {
    el[name] = value;
  } else {
    el.setAttribute(name, value);
  }

  attrs[name] = value;
};


/**
 * Applies a style to an Element. No vendor prefix expansion is done for
 * property names/values.
 * @param {!Element} el
 * @param {string|Object<string,string>} style The style to set. Either a string
 *     of css or an object containing property-value pairs.
 */
var applyStyle = function(el, style) {
  if (typeof style === 'string' || style instanceof String) {
    el.style.cssText = style;
  } else {
    el.style.cssText = '';

    for (var prop in style) {
      el.style[prop] = style[prop];
    }
  }
};


/**
 * Updates a single attribute on an Element. For some types (e.g. id or class),
 * the value is applied directly to the Element using the corresponding accessor
 * function.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value. If the value is a string, it is set
 *     as an HTML attribute, otherwise, it is set on node.
 */
var updateAttribute = function(el, name, value) {
  switch (name) {
    case 'id':
      el.id = value;
      break;
    case 'class':
      el.className = value;
      break;
    case 'tabindex':
      el.tabIndex = value;
      break;
    case 'style':
      applyStyle(el, value);
      break;
    default:
      applyAttr(el, name, value);
      break;
  }
};


/** */
module.exports = {
  updateAttribute: updateAttribute
};


},{"./node_data":4}],4:[function(require,module,exports){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * Keeps track of information needed to perform diffs for a given DOM node.
 * @param {?string} nodeName
 * @param {?string} key
 * @constructor
 */
function NodeData(nodeName, key) {
  /**
   * The attributes and their values.
   * @const
   */
  this.attrs = {};

  /**
   * An array of attribute name/value pairs, used for quickly diffing the
   * incomming attributes to see if the DOM node's attributes need to be
   * updated.
   * @const {Array<*>}
   */
  this.attrsArr = [];

  /**
   * The incoming attributes for this Node, before they are updated.
   * @const {!Object<string, *>}
   */
  this.newAttrs = {};

  /**
   * The key used to identify this node, used to preserve DOM nodes when they
   * move within their parent.
   * @const
   */
  this.key = key;

  /**
   * Keeps track of children within this node by their key.
   * {?Object<string, Node>}
   */
  this.keyMap = null;

  /**
   * The last child to have been visited within the current pass.
   * {?Node}
   */
  this.lastVisitedChild = null;

  /**
   * The node name for this node.
   * @const
   */
  this.nodeName = nodeName;

  /**
   * @const {string}
   */
  this.text = null;
}


/**
 * Initializes a NodeData object for a Node.
 *
 * @param {!Node} node The node to initialze data for.
 * @param {string} nodeName The node name of node.
 * @param {?string} key The key that identifies the node.
 * @return {!NodeData} The newly initialized data object
 */
var initData = function(node, nodeName, key) {
  var data = new NodeData(nodeName, key);
  node['__incrementalDOMData'] = data;
  return data;
};


/**
 * Retrieves the NodeData object for a Node, creating it if necessary.
 *
 * @param {!Node} node The node to retrieve the data for.
 * @return {NodeData} The NodeData for this Node.
 */
var getData = function(node) {
  var data = node['__incrementalDOMData'];

  if (!data) {
    var nodeName = node.nodeName.toLowerCase();
    var key = null;

    if (node instanceof Element) {
      key = node.getAttribute('key');
    }

    data = initData(node, nodeName, key);
  }

  return data;
};


/** */
module.exports = {
  getData: getData,
  initData: initData
};


},{}],5:[function(require,module,exports){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var updateAttribute = require('./attributes').updateAttribute;
var nodeData = require('./node_data'),
    getData = nodeData.getData,
    initData = nodeData.initData;


/**
 * Creates an Element.
 * @param {!Document} doc The document with which to create the Element.
 * @param {string} tag The tag for the Element.
 * @param {?string} key A key to identify the Element.
 * @param {?Array<*>} statics An array of attribute name/value pairs of
 *     the static attributes for the Element.
 * @return {!Element}
 */
var createElement = function(doc, tag, key, statics) {
  var el = doc.createElement(tag);
  initData(el, tag, key);

  if (statics) {
    for (var i = 0; i < statics.length; i += 2) {
      updateAttribute(el, statics[i], statics[i + 1]);
    }
  }

  return el;
};

/**
 * Creates a Text.
 * @param {!Document} doc The document with which to create the Text.
 * @param {string} text The intial content of the Text.
 * @return {!Text}
 */
var createTextNode = function(doc, text) {
  var node = doc.createTextNode(text);
  getData(node).text = text;

  return node;
};


/**
 * Creates a Node, either a Text or an Element depending on the node name
 * provided.
 * @param {!Document} doc The document with which to create the Node.
 * @param {string} nodeName The tag if creating an element or #text to create
 *     a Text.
 * @param {?string} key A key to identify the Element.
 * @param {?Array<*>|string} statics The static data to initialize the Node
 *     with. For an Element, an array of attribute name/value pairs of
 *     the static attributes for the Element. For a Text, a string with the
 *     intial content of the Text.
 * @return {!Node}
 */
var createNode = function(doc, nodeName, key, statics) {
  if (nodeName === '#text') {
    return createTextNode(doc, statics);
  }

  return createElement(doc, nodeName, key, statics);
};


/**
 * Creates a mapping that can be used to look up children using a key.
 * @param {!Element} el
 * @return {!Object<string, !Node>} A mapping of keys to the children of the
 *     Element.
 */
var createKeyMap = function(el) {
  var map = {};
  var children = el.children;
  var count = children.length;

  for (var i = 0; i < count; i += 1) {
    var child = children[i];
    var key = getKey(child);

    if (key) {
      map[key] = child;
    }
  }

  return map;
};


/**
 * @param {?Node} node A node to get the key for.
 * @return {?string} The key for the Node, if applicable.
 */
var getKey = function(node) {
  return getData(node).key;
};


/**
 * @param {?Node} node A node to get the node name for.
 * @return {?string} The node name for the Node, if applicable.
 */
var getNodeName = function(node) {
  return getData(node).nodeName;
};


/**
 * Retrieves the mapping of key to child node for a given Element, creating it
 * if necessary.
 * @param {!Element} el
 * @return {!Object<string,!Node>} A mapping of keys to child Nodes
 */
var getKeyMap = function(el) {
  var data = getData(el);

  if (!data.keyMap) {
    data.keyMap = createKeyMap(el);
  }

  return data.keyMap;
};


/**
 * Retrieves a child from the parent with the given key.
 * @param {!Element} parent
 * @param {?string} key
 * @return {?Node} The child corresponding to the key.
 */
var getChild = function(parent, key) {
  return getKeyMap(parent)[key];
};


/**
 * Registers a node as being a child. If a key is provided, the parent will
 * keep track of the child using the key. The child can be retrieved using the
 * same key using getKeyMap. The provided key should be unique within the
 * parent Element.
 * @param {!Element} parent The parent of child.
 * @param {?string} key A key to identify the child with.
 * @param {!Node} child The child to register.
 */
var registerChild = function(parent, key, child) {
  if (key) {
    getKeyMap(parent)[key] = child;
  }
};


/** */
module.exports = {
  createNode: createNode,
  getKey: getKey,
  getNodeName: getNodeName,
  getChild: getChild,
  registerChild: registerChild
};


},{"./attributes":3,"./node_data":4}],6:[function(require,module,exports){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var traversal = require('./traversal'),
    firstChild = traversal.firstChild,
    parentNode = traversal.parentNode;
var TreeWalker = require('./tree_walker');
var walker = require('./walker'),
    getWalker = walker.getWalker,
    setWalker = walker.setWalker;


/**
 * Patches the document starting at el with the provided function. This function
 * may be called during an existing patch operation.
 * @param {!Element} el the element to patch
 * @param {!function} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM.
 */
var patch = function(el, fn) {
  var prevWalker = getWalker();
  setWalker(new TreeWalker(el));

  firstChild();
  fn();
  parentNode();

  setWalker(prevWalker);
};


/** */
module.exports = {
  patch: patch
};


},{"./traversal":7,"./tree_walker":8,"./walker":10}],7:[function(require,module,exports){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var getWalker = require('./walker').getWalker;
var getData = require('./node_data').getData;


/**
 * Enters a Element, clearing out the last visited child field.
 * @param {!Element} node
 */
var enterNode = function(node) {
  var data = getData(node);
  data.lastVisitedChild = null;
};


/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 * @param {!Element} node
 */
var exitNode = function(node) {
  var data = getData(node);
  var lastVisitedChild = data.lastVisitedChild;

  if (node.lastChild === lastVisitedChild) {
    return;
  }

  while (node.lastChild !== lastVisitedChild) {
    node.removeChild(node.lastChild);
  }

  // Invalidate the key map since we removed children. It will get recreated
  // next time we need it.
  data.keyMap = null;
};


/**
 * Marks a parent as having visited a child.
 * @param {!Element} parent
 * @param {!Node} child
 */
var markVisited = function(parent, child) {
  var data = getData(parent);
  data.lastVisitedChild = child;
};


/**
 * Changes to the first child of the current node.
 */
var firstChild = function() {
  var walker = getWalker();
  enterNode(walker.currentNode);
  walker.firstChild();
};


/**
 * Changes to the next sibling of the current node.
 */
var nextSibling = function() {
  var walker = getWalker();
  walker.nextSibling();
};


/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
var parentNode = function() {
  var walker = getWalker();
  walker.parentNode();
  exitNode(walker.currentNode);
};


/** */
module.exports = {
  firstChild: firstChild,
  nextSibling: nextSibling,
  parentNode: parentNode,
  markVisited: markVisited
};


},{"./node_data":4,"./walker":10}],8:[function(require,module,exports){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Similar to the built-in Treewalker class, but simplified and allows direct
 * access to modify the currentNode property.
 * @param {!Node} node The root Node of the subtree the walker should start
 *     traversing.
 * @constructor
 */
function TreeWalker(node) {
  /**
   * Keeps track of the current parent node. This is necessary as the traversal
   * methods may traverse past the last child and we still need a way to get
   * back to the parent.
   * @const @private {!Array<!Node>}
   */
  this.stack_ = [];

  /** {?Node} */
  this.currentNode = node;

  /** {!Document} */
  this.doc = node.ownerDocument;
}


/**
 * @return {!Node} The current parent of the current location in the subtree.
 */
TreeWalker.prototype.getCurrentParent = function() {
  return this.stack_[this.stack_.length - 1];
};


/**
 * Changes the current location the firstChild of the current location.
 */
TreeWalker.prototype.firstChild = function() {
  this.stack_.push(this.currentNode);
  this.currentNode = this.currentNode.firstChild;
};


/**
 * Changes the current location the nextSibling of the current location.
 */
TreeWalker.prototype.nextSibling = function() {
  this.currentNode = this.currentNode.nextSibling;
};


/**
 * Changes the current location the parentNode of the current location.
 */
TreeWalker.prototype.parentNode = function() {
  this.currentNode = this.stack_.pop();
};


/** */
module.exports = TreeWalker;


},{}],9:[function(require,module,exports){
(function (process){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var alignWithDOM = require('./alignment').alignWithDOM;
var updateAttribute = require('./attributes').updateAttribute;
var getData = require('./node_data').getData;
var getWalker = require('./walker').getWalker;
var traversal = require('./traversal'),
    firstChild = traversal.firstChild,
    nextSibling = traversal.nextSibling,
    parentNode = traversal.parentNode;


/**
 * The offset in the virtual element declaration where the attributes are
 * specified.
 * @const
 */
var ATTRIBUTES_OFFSET = 3;


/**
 * Builds an array of arguments for use with elementOpenStart, attr and
 * elementOpenEnd.
 * @type {Array<*>}
 * @const
 */
var argsBuilder = [];


if (process.env.NODE_ENV !== 'production') {
  /**
   * Keeps track whether or not we are in an attributes declaration (after
   * elementOpenStart, but before elementOpenEnd).
   * @type {boolean}
   */
  var inAttributes = false;


  /** Makes sure that the caller is not where attributes are expected. */
  var assertNotInAttributes = function() {
    if (inAttributes) {
      throw new Error('Was not expecting a call to attr or elementOpenEnd, ' +
          'they must follow a call to elementOpenStart.');
    }
  };


  /** Makes sure that the caller is where attributes are expected. */
  var assertInAttributes = function() {
    if (!inAttributes) {
      throw new Error('Was expecting a call to attr or elementOpenEnd. ' +
          'elementOpenStart must be followed by zero or more calls to attr, ' +
          'then one call to elementOpenEnd.');
    }
  };


  /** Updates the state to being in an attribute declaration. */
  var setInAttributes = function() {
    inAttributes = true;
  };


  /** Updates the state to not being in an attribute declaration. */
  var setNotInAttributes = function() {
    inAttributes = false;
  };
}


/**
 * Checks to see if one or more attributes have changed for a given
 * Element. When no attributes have changed, this function is much faster than
 * checking each individual argument. When attributes have changed, the overhead
 * of this function is minimal.
 *
 * This function is called in the context of the Element and the arguments from
 * elementOpen-like function so that the arguments are not de-optimized.
 *
 * @this {Element} The Element to check for changed attributes.
 * @param {*} unused1
 * @param {*} unused2
 * @param {*} unused3
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {boolean} True if the Element has one or more changed attributes,
 *     false otherwise.
 */
var hasChangedAttrs = function(unused1, unused2, unused3, var_args) {
  var data = getData(this);
  var attrsArr = data.attrsArr;
  var attrsChanged = false;
  var i;

  for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
    // Translate the from the arguments index (for values) to the attribute's
    // ordinal. The attribute values are at arguments index 3, 5, 7, etc. To get
    // the ordinal, need to subtract the offset and divide by 2
    if (attrsArr[(i - ATTRIBUTES_OFFSET) >> 1] !== arguments[i + 1]) {
      attrsChanged = true;
      break;
    }
  }

  if (attrsChanged) {
    for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
      attrsArr[(i - ATTRIBUTES_OFFSET) >> 1] = arguments[i + 1];
    }
  }

  return attrsChanged;
};


/**
 * Updates the newAttrs object for an Element.
 *
 * This function is called in the context of the Element and the arguments from
 * elementOpen-like function so that the arguments are not de-optimized.
 *
 * @this {Element} The Element to update newAttrs for.
 * @param {*} unused1
 * @param {*} unused2
 * @param {*} unused3
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Object<string, *>} The updated newAttrs object.
 */
var updateNewAttrs = function(unused1, unused2, unused3, var_args) {
  var node = this;
  var data = getData(node);
  var newAttrs = data.newAttrs;

  for (var attr in newAttrs) {
    newAttrs[attr] = undefined;
  }

  for (var i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
    newAttrs[arguments[i]] = arguments[i + 1];
  }

  return newAttrs;
};


/**
 * Updates the attributes for a given Element.
 * @param {!Element} node
 * @param {!Object<string,*>} newAttrs The new attributes for node
 */
var updateAttributes = function(node, newAttrs) {
  for (var attr in newAttrs) {
    updateAttribute(node, attr, newAttrs[attr]);
  }
};


/**
 * Declares a virtual Element at the current location in the document. This
 * corresponds to an opening tag and a elementClose tag is required.
 * @param {string} tag The element's tag.
 * @param {?string} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 */
var elementOpen = function(tag, key, statics, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes();
  }

  var node = alignWithDOM(tag, key, statics);

  if (hasChangedAttrs.apply(node, arguments)) {
    var newAttrs = updateNewAttrs.apply(node, arguments);
    updateAttributes(node, newAttrs);
  }

  firstChild();
};


/**
 * Declares a virtual Element at the current location in the document. This
 * corresponds to an opening tag and a elementClose tag is required. This is
 * like elementOpen, but the attributes are defined using the attr function
 * rather than being passed as arguments. Must be folllowed by 0 or more calls
 * to attr, then a call to elementOpenEnd.
 * @param {string} tag The element's tag.
 * @param {?string} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 */
var elementOpenStart = function(tag, key, statics) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes();
    setInAttributes();
  }

  argsBuilder[0] = tag;
  argsBuilder[1] = key;
  argsBuilder[2] = statics;
  argsBuilder.length = ATTRIBUTES_OFFSET;
};


/***
 * Defines a virtual attribute at this point of the DOM. This is only valid
 * when called between elementOpenStart and elementOpenEnd.
 *
 * @param {string} name
 * @param {*} value
 */
var attr = function(name, value) {
  if (process.env.NODE_ENV !== 'production') {
    assertInAttributes();
  }

  argsBuilder.push(name, value);
};


/**
 * Closes an open tag started with elementOpenStart.
 */
var elementOpenEnd = function() {
  if (process.env.NODE_ENV !== 'production') {
    assertInAttributes();
    setNotInAttributes();
  }

  elementOpen.apply(null, argsBuilder);
};


/**
 * Closes an open virtual Element.
 *
 * @param {string} tag The element's tag.
 */
var elementClose = function(tag) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes();
  }

  parentNode();
  nextSibling();
};


/**
 * Declares a virtual Element at the current location in the document that has
 * no children.
 * @param {string} tag The element's tag.
 * @param {?string} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 */
var elementVoid = function(tag, key, statics, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes();
  }

  elementOpen.apply(null, arguments);
  elementClose.apply(null, arguments);
};


/**
 * Declares a virtual Text at this point in the document.
 *
 * @param {string} value The text of the Text.
 */
var text = function(value) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes();
  }

  var node = alignWithDOM('#text', null, value);
  var data = getData(node);

  if (data.text !== value) {
    node.data = value;
    data.text = value;
  }

  nextSibling();
};


/** */
module.exports = {
  elementOpenStart: elementOpenStart,
  elementOpenEnd: elementOpenEnd,
  elementOpen: elementOpen,
  elementVoid: elementVoid,
  elementClose: elementClose,
  text: text,
  attr: attr
};


}).call(this,require('_process'))
},{"./alignment":2,"./attributes":3,"./node_data":4,"./traversal":7,"./walker":10,"_process":14}],10:[function(require,module,exports){
/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @type {TreeWalker}
 */
var walker_;


/**
 * @return {TreeWalker} the current TreeWalker
 */
var getWalker = function() {
  return walker_;
};


/**
 * Sets the current TreeWalker
 * @param {TreeWalker} walker
 */
var setWalker = function(walker) {
  walker_ = walker;
};


/** */
module.exports = {
  getWalker: getWalker,
  setWalker: setWalker
};


},{}],11:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _todoList = require('./todo-list');

var _todoList2 = _interopRequireDefault(_todoList);

var formContainer = document.getElementById('todo-form');
var todoContainer = document.getElementById('todo');

var myList = new _todoList2['default']();

myList.render(todoContainer);

var form = document.getElementById('add-todo');

form.addEventListener('submit', function (ev) {
  ev.preventDefault();
  var input = form.elements.namedItem('new-item');
  myList.addItem(input.value);
  input.value = '';
});

},{"./todo-list":13}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x4, _x5, _x6) { var _again = true; _function: while (_again) { var object = _x4, property = _x5, receiver = _x6; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x4 = parent; _x5 = property; _x6 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _incrementalDom = require('incremental-dom');

var _incrementalDom2 = _interopRequireDefault(_incrementalDom);

var render = function render(el, container) {
  _incrementalDom2['default'].patch(container, el.render.bind(el));
};

/**
 * Represents a HTML Element
 */
exports.render = render;

var EL = (function () {
  /**
   * Creates a new element
   *
   * @abstract
   * @param {string} tag the specific HTML TAG of the Element.
   * @param {null|String|EL|Array} content
   * @param {Array} props
   */

  function EL(tag) {
    var content = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var key = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
    var props = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    _classCallCheck(this, EL);

    this.tag = tag;
    this.content = content;
    this.key = key;
    this.props = props;
  }

  /**
   * Renders this Element.
   *
   *
   */

  _createClass(EL, [{
    key: 'render',
    value: function render() {
      if (null === this.content) {
        _incrementalDom2['default'].elementVoid(this.tag, this.key, this.props);
        return;
      }

      _incrementalDom2['default'].elementOpen(this.tag, this.key, this.props);

      if ('string' === typeof this.content) {
        _incrementalDom2['default'].text(this.content);
      } else if (Array.isArray(this.content)) {
        this.content.forEach(function (c) {
          if ('string' === typeof c) {
            _incrementalDom2['default'].text(c);
            return;
          }

          c.render();
        });
      } else {
        this.content.render();
      }

      _incrementalDom2['default'].elementClose(this.tag);
    }
  }]);

  return EL;
})();

exports.EL = EL;

var LI = (function (_EL) {
  _inherits(LI, _EL);

  function LI(content, key, props) {
    _classCallCheck(this, LI);

    _get(Object.getPrototypeOf(LI.prototype), 'constructor', this).call(this, 'li', content, key, props);
  }

  return LI;
})(EL);

exports.LI = LI;

var UL = (function (_EL2) {
  _inherits(UL, _EL2);

  function UL(elms, key, props) {
    if (elms === undefined) elms = [];

    _classCallCheck(this, UL);

    _get(Object.getPrototypeOf(UL.prototype), 'constructor', this).call(this, 'ul', elms, key, props);
  }

  return UL;
})(EL);

exports.UL = UL;

var FORM = (function (_EL3) {
  _inherits(FORM, _EL3);

  function FORM(elms, key, props) {
    _classCallCheck(this, FORM);

    _get(Object.getPrototypeOf(FORM.prototype), 'constructor', this).call(this, 'form', elms, key, props);
  }

  return FORM;
})(EL);

exports.FORM = FORM;

var INPUT = (function (_EL4) {
  _inherits(INPUT, _EL4);

  function INPUT(key, props) {
    _classCallCheck(this, INPUT);

    _get(Object.getPrototypeOf(INPUT.prototype), 'constructor', this).call(this, 'input', null, key, props);
  }

  return INPUT;
})(EL);

exports.INPUT = INPUT;

var BUTTON = (function (_EL5) {
  _inherits(BUTTON, _EL5);

  function BUTTON(elms, key, props) {
    _classCallCheck(this, BUTTON);

    _get(Object.getPrototypeOf(BUTTON.prototype), 'constructor', this).call(this, 'button', elms, key, props);
  }

  return BUTTON;
})(EL);

exports.BUTTON = BUTTON;

var H4 = (function (_EL6) {
  _inherits(H4, _EL6);

  function H4(elms, key, props) {
    _classCallCheck(this, H4);

    _get(Object.getPrototypeOf(H4.prototype), 'constructor', this).call(this, 'H4', elms, key, props);
  }

  return H4;
})(EL);

exports.H4 = H4;

var A = (function (_EL7) {
  _inherits(A, _EL7);

  function A(elms, key, props) {
    _classCallCheck(this, A);

    _get(Object.getPrototypeOf(A.prototype), 'constructor', this).call(this, 'A', elms, key, props);
  }

  return A;
})(EL);

exports.A = A;

var I = (function (_EL8) {
  _inherits(I, _EL8);

  function I(elms, key, props) {
    _classCallCheck(this, I);

    _get(Object.getPrototypeOf(I.prototype), 'constructor', this).call(this, 'I', elms, key, props);
  }

  return I;
})(EL);

exports.I = I;

var DIV = (function (_EL9) {
  _inherits(DIV, _EL9);

  function DIV(elms, key, props) {
    _classCallCheck(this, DIV);

    _get(Object.getPrototypeOf(DIV.prototype), 'constructor', this).call(this, 'DIV', elms, key, props);
  }

  return DIV;
})(EL);

exports.DIV = DIV;

},{"incremental-dom":1}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _template = require('./template');

/**
 * Represents a new todo-list
 */

var TodoList = (function () {
  function TodoList() {
    var _this = this;

    var list = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    _classCallCheck(this, TodoList);

    this.list = {};
    list.forEach(function (el) {
      _this.addItem(el);
    });
  }

  /**
   * Adds a new item to the list
   *
   * @param {string} text todo-item's text
   */

  _createClass(TodoList, [{
    key: 'addItem',
    value: function addItem(text) {
      var idx = Date.now();
      this.list[idx] = text;
      this.render();
    }

    /**
     * Removes an item from the list.
     *
     * @param {string} idx id of the element to remove
     */
  }, {
    key: 'removeItem',
    value: function removeItem(idx) {
      delete this.list[idx];
      this.render();
    }

    /**
     * Attach the events needed by the component
     *
     * @private
     */
  }, {
    key: '_attachEvents',
    value: function _attachEvents() {
      var _this2 = this;

      var done_anchors = this.container.getElementsByTagName('a');
      Array.prototype.forEach.call(done_anchors, function (anchor) {
        anchor.addEventListener('click', function (ev) {
          ev.preventDefault();
          var idx = anchor.parentElement.parentElement.dataset.idx;
          _this2.removeItem(idx);
        });
      });
    }

    /**
     * Creates an array with each individual item Element.
     *
     * @private
     */
  }, {
    key: '_renderItems',
    value: function _renderItems() {
      var _this3 = this;

      return Object.keys(this.list).map(function (idx) {
        return new _template.LI(new _template.DIV([_this3.list[idx], new _template.A(new _template.I('send', null, ['class', 'material-icons']), null, ['class', 'secondary-content', 'href', '#!'])]), idx, ['data-idx', idx, 'class', 'collection-item']);
      });
    }

    /**
     * Renders the todo-list's component into a specified container.
     *
     * @param {HTMLElement} container the container where the todo-list is going to be rendered.
     */
  }, {
    key: 'render',
    value: function render(container) {
      this.container = container || this.container || document.body;
      var items = this._renderItems();
      if (items.length) {
        (0, _template.render)(new _template.UL(items, null, ['class', 'collection']), this.container);
      } else {
        (0, _template.render)(new _template.DIV('Hooray! you are free!', null, ['class', 'center']), this.container);
      }
      this._attachEvents();
    }
  }]);

  return TodoList;
})();

exports['default'] = TodoList;
module.exports = exports['default'];

},{"./template":12}],14:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[11]);
