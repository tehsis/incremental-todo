# Incremental TO-DO 

## Description

This is an usage example of [Incremental DOM](https://github.com/google/incremental-dom).

## Build Instructions

1 - Make sure you have [Node.js](https://nodejs.org) installed.
2 - Install [Browserify](https://browserify.org).
3 - In the project's root `npm i`
4 - Make sure to have [GNU Make](www.gnu.org/s/make/) installed and run `make`

## Arquitecture

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
