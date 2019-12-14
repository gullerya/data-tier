[![GitHub](https://img.shields.io/github/license/gullerya/data-tier.svg)](https://github.com/gullerya/data-tier)
[![NPM](https://img.shields.io/npm/v/data-tier.svg?label=npm%20data-tier)](https://www.npmjs.com/package/data-tier)
[![Travis](https://img.shields.io/travis/gullerya/data-tier.svg)](https://travis-ci.org/gullerya/data-tier)
[![Codecov](https://img.shields.io/codecov/c/github/gullerya/data-tier/master.svg)](https://codecov.io/gh/gullerya/data-tier/branch/master)
[![Codacy](https://img.shields.io/codacy/grade/eb34053e002648519fd3a2d78c45677b.svg?logo=codacy)](https://app.codacy.com/app/gullerya/data-tier)

## Overview

`data-tier` ('tier' from 'to tie') is a two way binding (MVVM) service targeting client (browser) HTML/Javascript applications.
`data-tier` relies on an [`Observable`](https://github.com/gullerya/object-observer/blob/master/docs/observable.md)-driven event cycle, having an embedded [`object-observer`](https://github.com/gullerya/object-observer) as the default `Observable` provider.

> In future I may consider allowing provision of custom `Observable` implementation if there will be any interest in it.

#### Support matrix: ![CHROME](https://github.com/gullerya/data-tier/raw/master/docs/icons/chrome.png)<sub>61+</sub> | ![FIREFOX](https://github.com/gullerya/data-tier/raw/master/docs/icons/firefox.png)<sub>60+</sub>

#### Performance report: TBD

#### Versions ([full changelog](https://github.com/gullerya/data-tier/blob/master/docs/changelog.md))

* __2.0.0__
  * implemented [issue #29](https://github.com/gullerya/data-tier/issues/29) - removing non-convenience and ambiguity in API usage
> !!! This is API breaking change!. While migration from an old API to the new one is easy - take care to go over the docs here.

* __1.14.0__
  * upgrading `object-observer` dependency, which has a fix for a proper handling of an Error objects

* __1.13.1__
  * fixed [issue #32](https://github.com/gullerya/data-tier/issues/32) - when mistakenly same property tied more than once - error is shown, the first one is effective
  * fixed [issue #33](https://github.com/gullerya/data-tier/issues/33) - fixes a defect with NULL value in the deep object's tied path
  * fixed issue (non-reported) with creation of non existing path by change event

## Loading the Library

```javascript
import * as DataTier from './dist/data-tier.min.js';    // align the path with your folders structure
```

## Basic concepts

My, definitely opinionated, insights of how client application should look like in general and how `data-tier` library comes into that picture can be found [__here__](https://github.com/gullerya/data-tier/blob/master/docs/client-app-architecture.md). That is probably the most complete overview of the library's overall usage intent. Yet, please read below for a short conceptual intro.

As many similar libraries do it, `data-tier` also empasized a two: the __declarative__ part of binding views to model found in `HTML` and the __functional__ part of defining/operating the model self from `JS`.

Let's observe the following example, where having data as
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
bands.totalTooltip = 'My hall-of-fame bands';
```
one can create a __tie__ keyed, say, 'bandsTie', having its data set to the bands array:
```javascript
let bandsModel = DataTier.ties.create('bandsTie', bands);
```

__`Tie`__ is the __model__, to use the classic terminology.
It holds an __observable__ data either provided upon creation or an empty object to begin with, if none provided.

Now one can bind (tie) any UI element to the model using the key and the path:
```html
<span data-tie="bandsTie:length => textContent, bandsTie:totalTooltip => tooltip"></span>

<div>
    <span data-tie="bandsTie:0.albums.1.name => textContent"></span>
    <custom-album-viewer data-tie="bandsTie:0.albums.1 => data"></custom-album-viewer>
</div>
```
where:
* the first item in the path is always the tie's key, having colon separating it from an actual path within the model
* `bandsTie:0` - refer to the whole object at index 0 of our array
* `bandsTie:length` - `length` property, inherited from the native `Array`, may also be used
* `bandsTie:0.name` - path can get deeper...
* `bandsTie:0.albums.1.since` - ...actually, it can get to any level of deepness

It is possible to create a single dataset for the whole application, making a single 'uber-tie' from it and operating everything from there, but IMHO it would be a bad practice.
Having say that, I'll note, that there is no limitations on the size or the structure complexity of the tied model, nor there are any negative effects of those on the library performance.

For more details see [__API reference__](https://github.com/gullerya/data-tier/blob/master/docs/api-reference.md).

## Extensions

I believe, and already outlined that [somewhere else](https://github.com/gullerya/data-tier/blob/master/docs/client-app-architecture.md), that `data-tier` as a framework should serve a single purpose of tying the model with the view in its very basic form: propagating the changes/values to the relevant recipient/s.

Functionalities like `repeater`, `router` and other well known UI paradigms should be provided by a __dedicated components__, probably, yet not necessary, built on top of `data-tier` or any other framework.

Me myself investing some effort in building `data-tier` oriented components. I'll maintain the list below, updating it from time to time (please update me if you have something to add here).
* [`data-tier-list`](https://www.npmjs.com/package/data-tier-list) - repeater-like component to render a list of a similar items based on the single template

## Documentation
[__API__](https://github.com/gullerya/data-tier/blob/master/docs/api-reference.md)

[__WebComponents, ShadowDOM, MicroFrontends__](https://github.com/gullerya/data-tier/blob/master/docs/web-components.md)

[__Tutorials__](https://github.com/gullerya/data-tier/blob/master/docs/tutorials.md)
