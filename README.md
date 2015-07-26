# Incremental TO-DO

[See it in action](https://tehsis.github.io/incremental-todo)

## Description

This is an usage example of [Incremental DOM](https://github.com/google/incremental-dom).

## Build Instructions

1 - Make sure you have [Node.js](https://nodejs.org) installed.
2 - Install [Browserify](https://browserify.org).
3 - In the project's root `npm i`
4 - Make sure to have [GNU Make](www.gnu.org/s/make/) installed and run `make`

## Architecture

This example was build using _Incremental DOM_ for DOM generation and [Babel](https://babeljs.org).

It was building using a DOM's element abstraction librarie that you can find inside `template/` folder.

While not complete yet, this library allows you to create DOM Elements in the following forms:

```js
import {A, render} from './template'

let myContainer = document.getElementById('container');

let myAnchor = new A('my link', null, ['href', 'http://tehsis.me');

render(myContainer, myAnchor);
```

This will render

```html
<a href="http://tehsis.me">my link</a>

```

under the specified DOM element.

Here, `render` is just a call to _Incremental DOM_'s `patch` method.

It can also build more complex HTML structures

```js

import {

let myContainer = document.getElementById('container');

let myElement = new DIV([
  H1('Welcome!'),
  new UL([
   new LI('this is'),
   new LI('a list')
  ]);
]);

render(myContainer, myElement);
```

That will render

```html
<div>
<h1>Welcome!</h1>
<ul>
  <li>this is</li>
  <li>a list</li>
</ul>
</div>
```

This abstraction makes use of _Incremental DOM_ magic and comes in handy for mutating DOM as the following example

```js
// ...

let renderList = (list) => {
  return new UL([
    list.map((item) => new LI(item);
  ]);
};

let list = ['one', 'two'];

render(myContainer, renderList(list);

list.push('three');

render(myContainer, renderList(list);
```

Here we're simply 're-rendering' our all list, but thanks to Incremental DOM, it will just update the needed element.

For a more complete example, just take a look at this repo!
