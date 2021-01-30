[![NPM](https://img.shields.io/npm/v/data-tier.svg?label=npm%20data-tier)](https://www.npmjs.com/package/data-tier)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./license.md)

[![Quality pipeline](https://github.com/gullerya/data-tier/workflows/Quality%20pipeline/badge.svg?branch=master)](https://github.com/gullerya/data-tier/actions?query=workflow%3A%22Quality+pipeline%22)
[![Codecov](https://img.shields.io/codecov/c/github/gullerya/data-tier/master.svg)](https://codecov.io/gh/gullerya/data-tier/branch/master)
[![Codacy](https://img.shields.io/codacy/grade/eb34053e002648519fd3a2d78c45677b.svg?logo=codacy)](https://app.codacy.com/app/gullerya/data-tier)

## Overview

`data-tier` ('tier' from 'to tie') is a two way binding (MVVM) library targeting client (browser) HTML/Javascript applications.
`data-tier` relies on an [`Observable`](https://github.com/gullerya/object-observer/blob/master/docs/observable.md)-driven event cycle, having an embedded [`object-observer`](https://github.com/gullerya/object-observer) as the default `Observable` provider.

It is highly advised to briefly review the library's [Lifecycle](./docs/lifecycle.md) documentation for a main concepts. Once ready, [`data-tier`'s approach to client app architecture](./docs/client-app-architecture.md) will also have a bunch of useful information on when and how to employ data binding in a modern client applications in a non-intrusive, non-prisoning, managable and extensible way.

#### Support matrix
![CHROME](./docs/icons/chrome.png)<sub>61+</sub> | ![FIREFOX](./docs/icons/firefox.png)<sub>60+</sub> | ![EDGE](./docs/icons/edge-chromium.png)<sub>79+</sub>

#### Versions ([full changelog](./docs/changelog.md))

* __3.1.0__
  * implemented [Issue #58](https://github.com/gullerya/data-tier/issues/58) - allowed to create/update ties with primitive model (`boolean`, `number`, `string`)
  * implemented [Issue #59](https://github.com/gullerya/data-tier/issues/59) - capable of create/update ties with null
  * nullish model values (`null`, `undefined`) transformation into an empty string is now limited to only:
    * `textContent` target property for any element
	* `value` target property for these: `INPUT`, `SELECT`, `TEXTAREA`

* __3.0.0__
  * implemented [Issue #60](https://github.com/gullerya/data-tier/issues/60):
    * removed `defaultTieTarget` property support (less intrusive approach aggenda)
    * removed `changeEvent` property support (less intrusive approach aggenda)
    * added new syntax to specify the event to listen to per tied property
    * added support for multiple events as per multiple properties tied

* __2.12.0__
  * upgaded dependencies
  * implemented [Issue #61](https://github.com/gullerya/data-tier/issues/61) - release version automation

## Loading the library

`data-tier` provided as an ES6 module:

```javascript
import * as DataTier from './dist/data-tier.min.js';
```

## Basic example

There is a growing number of examples and ready to run tutorials in the repo self (`docs/tutorials`), but even more convenient is to play with the `CodePen` snippets below:
* [DataTier binding with regular DOM elements](https://codepen.io/gullerya/pen/abdmebe) - simple `input` element, its `change` event and `span` reflecting the changed value
* [WebComponent scoped binding](https://codepen.io/gullerya/pen/xxZEvbK) - this time we have `input` tied to the reflecting `span` by an `input` event (immediate changes), while all of those scoped within a `web-component`, each instance of which has its own encapsulated model
* ... more to come :)

As many similar libraries do, `data-tier` also employes the two:
* __declarative__ part of binding views to model found in HTML
* __functional__ part of defining and operating on the model in JavaScript

Let's see how it plays in the code.

##### functional (JS) part

Having data model defined, for example, as:
```javascript
let bands = [
    {
        id: 1234,
        name: 'Dream Theater',
        since: 1985,
        albums: [
            { id: 2345, year: 1988, name: 'When Dream and Day Unite' },
            { id: 2346, year: 1991, name: 'Images and Words' }
        ]
    }
];
```
one can create a __`tie`__ keyed, say, 'bandsTie', having its data set to the bands array:
```javascript
const bandsModel = DataTier.ties.create('bandsTie', bands);
```

`create` API returns an [`Observable`](https://github.com/gullerya/object-observer/blob/master/docs/observable.md) clone of the provided `object`/`array`.

> If no model provided, `data-tier` will create an empty object model by default.

`bandsModel` from our example may be operated on as a usual JS `object`/`array`, but it is also being observed by `data-tier` for any (deep) changes.

Any direct (JS driven) change will be reflected in the tied views.
Also, any relevant changes from the views will be reflected in the `bandsModel` back.

##### declarative (HTML) part

Any UI element may be tied to the model using the key and the path:
```html
<span data-tie="bandsTie:length"></span>

<div>
    <span data-tie="bandsTie:0.albums.1.name"></span>
    <custom-album-viewer data-tie="bandsTie:0.albums.1 => data"></custom-album-viewer>
</div>
```

For more details see [__API reference__](./docs/api-reference.md).

## Extensions

I believe, that `data-tier` as a framework should serve a single purpose of tying the model with the view in its very basic form: propagating the changes/values to the relevant recipient/s (more conceptual details and examples [here](./docs/client-app-architecture.md)).

Functionalities like `repeater`, `router` and other well known UI paradigms should be provided by a __dedicated components__, probably, yet not necessary, built on top of `data-tier` or any other framework.

Me myself investing some effort in building `data-tier` oriented components. I'll maintain the list below, updating it from time to time (please update me if you have something to add here).
* [`data-tier-list`](https://www.npmjs.com/package/data-tier-list) - repeater-like component to render a list of a similar items based on a single template
* [`i18n`](https://www.npmjs.com/package/@gullerya/i18n) - internationalization library, mostly concerned with translation, where dynamic replacement of the localized texts upon active locale change is driven by `data-tier`

## Documentation

[__API__](./docs/api-reference.md)

[__WebComponents, ShadowDOM, MicroFrontends__](./docs/web-components.md)

[__Tutorials__](./docs/tutorials.md)
