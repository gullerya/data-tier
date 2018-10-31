[![GitHub](https://img.shields.io/github/license/gullerya/data-tier.svg)](https://github.com/gullerya/data-tier)
[![npm](https://img.shields.io/npm/v/data-tier.svg?label=npm%20data-tier)](https://www.npmjs.com/package/data-tier)
[![Build Status](https://travis-ci.org/gullerya/data-tier.svg?branch=master)](https://travis-ci.org/gullerya/data-tier)

## Overview

`data-tier` ('tier' from 'to tie') is a two way binding (MVVM) service targeting client (browser) HTML/Javascript applications.
`data-tier` relies on an [`Observable`](https://github.com/gullerya/object-observer/blob/master/docs/observable.md)-driven event cycle, having an embedded [`object-observer`](https://github.com/gullerya/object-observer) as the default `Observable` provider.

It is possible to provide custom `Observable` implementation. In this case you may want to use lighter `data-tier-wo-oo.js` where `object-observer.js` opted out.

#### Support matrix: ![CHROME](https://github.com/gullerya/data-tier/raw/master/docs/icons/chrome.png)<sub>49+</sub> | ![FIREFOX](https://github.com/gullerya/data-tier/raw/master/docs/icons/firefox.png)<sub>44+</sub> | ![EDGE](https://github.com/gullerya/data-tier/raw/master/docs/icons/edge.png)<sub>13+</sub>
Support matrix is currently as wide as that of [`object-observer`](https://github.com/gullerya/object-observer), assuming that in most of the cases consumers will not provide their own object observer, but will use an embedded one.
`data-tier` supports custom elements as well, obviously this functionality is available only on supporting environments.

> IMPORTANT! Starting with 0.6.20 version `data-tier` as ES6 module becomes available.
Yet, this one comes with API breaking changes as it is reflecting somewhat different approach to the architecture or data binding in web applications.
Read more on [this new API page](https://github.com/gullerya/data-tier/blob/master/new-readme.md).

> IMPORTANT! At some point of the first quarter of 2019 the non-ES6 module distribution will be removed from the `data-tier` and will be no longer supported in the following versions.

#### Versions ([full changelog](https://github.com/gullerya/data-tier/blob/master/docs/changelog.md))

* __0.6.25__
  * Fixed [issue no. 13](https://github.com/gullerya/data-tier/issues/13)

* __0.6.22__
  * initial provisioning of `data-tier` as ES6 module
  * new API defined and implemented in ES6 module distribution

* __0.6.19__
  * Fixed incorrect behavior when `tie-property` configured on the element **after** it was added to the DOM

## Loading the Library

You have few ways to load the library: as an __ES6 module__ (pay attention to the __`module`__ in the path) or as a __regular script__ (into a 'window' global scope, or a custom scope provided by you). See examples below.

> Attention: in some (observable :-)) future non-module syntax flavor will be frozen in a stable state and only defect fixes will be done there.
Active development will focus on the ES6 module code base, which is effectively raising the support matrix of Chrome to 61, FireFox to 60 and Edge to 16.
Also pay attention, that ES6 module styled library bear also significant API changes, see remark above in this page and elsewhere.

* ES6 module (__preferred__):
```javascript
//  browser
import * as DataTier from 'dist/module/data-tier.min.js';
```

* Simple reference (script tag) to the `data-tier.js`/`data-tier.min.js` in your HTML will load it into the __global scope__:
```html
<script src="data-tier.min.js"></script>
<script>
    let person = { name: 'Uriya', age: 8 },
        tiedPerson = DataTier.ties.create('person', person),
        tiedSettings = DataTier.ties.create('settings');
</script>
```
> __tie__ `person` has its `data` property set to `Observable.from(person)`, original `person` object remains untouched and its own changes __aren't__ being watched.
In order to make a changes on a tied object and see an immediate reflection in the UI use `tiedPerson.data` object.

> __tie__ `settings` has its `data` as `null`, it may be set to any object later on in this way: `tiedSettings.data = {}` (or any other arbitrary data structure).

* The snippet below exemplifies how to load the library into a __custom scope__ (add error handling as appropriate):
```javascript
let customNamespace = {},
    person = { name: 'Nava', age: 6 };

fetch('data-tier.min.js').then(function (response) {
    if (response.status === 200) {
        response.text().then(function (code) {
            Function(code).call(customNamespace);

            //  the below code is an example of consumption, locate it in your app lifecycle/flow as appropriate
            customNamespace.DataTier.ties.create('person', person);
        });
    }
});
```
- If an embedded `object-observer` employed, it is even more preferable to create the `Tie` from a plain JS object 
- Minified version is also available for both distributions, with and without `object-observer.js`


## Basic concepts

My, definitely opinionated, insights of how client application should look like in general and how `data-tier` library comes into that picture can be found [__here__](https://github.com/gullerya/data-tier/blob/master/docs/client-app-architecture.md). That would probably be the most completed overview of the library's overall usage intent.

Here I'll just outline the very essentials, namely 2 main concepts: __`Tie`__ and __`Controller`__.


#### Tie
> This part of the API will undergo slight change (mostly in the syntax of HTML part declaration) in the ES6 module approach.
See [new api](https://github.com/gullerya/data-tier/blob/master/new-readme.md) for more info.

__`Tie`__ holds an observable data structure associated with tie's name, it's about __what__ to tie.
Thus, ties serve most and foremost data segregation and management purposes.

Having the following data structure:
```javascript
let bands = [
    {
        id: 1234,
        name: 'Dream Theater',
        since: 1985,
        albums: [
            { id: 2345, name: 'When Dream and Day Unite', since: 1988 },
            { id: 2346, name: 'Images and Words', since: 1991 }
        ]
    }
];
bands.totalTooltip = generateTooltipText();
```
one can create a tie named, say, 'bandsTie', having its data set to the bands array:
```javascript
let bandsDataStore = DataTier.ties.create('bandsTie', bands);
```

and then tie any UI element to it via the tie name and the path:
```html
<span data-tie-text="bandsTie.length"
      data-tie-tooltip="bandsTie.totalTooltip">
</span>

<div>
    <template data-tie-list="bandsTie.0.albums => album">
        <span data-tie-text="album.name"></span>
    </template>
</div>
```
where:
* the first item in the path is always the tie's name
* `bandsTie.0` - refer to the whole object at index 0 of our array
* `bandsTie.length` - `length` property, inherited from the native `Array`, may also be used
* `bandsTie.0.name` - path can get deeper...
* `bandsTie.0.albums.1.since` - ...actually, it can get to any level of deepness

Basically, it is possible to create a single dataset for the whole application, making a single 'uber-tie' from it and operating everything from there, but it should be considered as a bad practice.
Having say that, I'll note, that there is no limitations on the size or the structure complexity of the tied model, nor there are any negative effects of those on application performance.

`Tie` object not only meant to hold the link between the data and its namespace, but also tie's specific configurations/customizations and data management APIs.
For more details see [__API reference__](https://github.com/gullerya/data-tier/blob/master/docs/api-reference.md).


#### Controller
> This part of the API will undergo significant change (mostly removal) in the ES6 module approach and eventually will become deprecated.
See [new api](https://github.com/gullerya/data-tier/blob/master/new-readme.md) for more info.

__`Controller`__ is a holder of the transition logic, it's about __how__ to translate the data from/to view/data.

Each controller has it's own unique name given to it upon registration.
Controllers are applied via the DOM's `data-*` attributes joining the `data-` prefix with rule's name: for example `data-tie-text` employs the controller 'tieText'.
```html
<span data-tie-text="bandsTie.length"
      data-tie-tooltip="bandsTie.totalTooltip">
</span>

<div>
    <template data-tie-list="bandsTie.0.albums => album">
        <span data-tie-text="album.name"></span>
    </template>
</div>
```
In the first part we tie between the `span` (view) and the model (we have tied it to both, `length` and `totalTooltip` values), while using 2 different OOTB controllers: 'tieText', 'tieTooltip'.
Attributes' values (`bandsTie.length`, `bandsTie.totalTooltip`) are controllers' configurations for this specific instance and their syntax/content is part of each controller's own API.

Thus, in the second part a `template` element tied by another OOTB controller: 'tieList'.
This one expects a richer content in its configuration: tie name and path for sure, but also some name for an item within iteration (here - 'album', and see its usage in the inner span element).

But even more important is the fact, that any custom controllers may be provided by the consuming application.
This can be done at any phase of application's lifecycle, so that there is no special ceremony around it whatsoever.
Controllers' management described in the relevant section in [__API reference__](https://github.com/gullerya/data-tier/blob/master/docs/api-reference.md).

## Documentation
[__New `data-tier`__](https://github.com/gullerya/data-tier/blob/master/new-readme.md)

[__Tutorials__](https://github.com/gullerya/data-tier/blob/master/docs/tutorials.md)
