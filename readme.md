[![GitHub](https://img.shields.io/github/license/gullerya/data-tier.svg)](https://github.com/gullerya/data-tier)
[![Travis](https://img.shields.io/travis/gullerya/data-tier.svg)](https://travis-ci.org/gullerya/data-tier)
[![NPM](https://img.shields.io/npm/v/data-tier.svg?label=npm%20data-tier)](https://www.npmjs.com/package/data-tier)

## Overview

`data-tier` ('tier' from 'to tie') is a two way binding (MVVM) service targeting client (browser) HTML/Javascript applications.
`data-tier` relies on an [`Observable`](https://github.com/gullerya/object-observer/blob/master/docs/observable.md)-driven event cycle, having an embedded [`object-observer`](https://github.com/gullerya/object-observer) as the default `Observable` provider.

> In future I may consider allowing provision of custom `Observable` implementation if there will be any interest in it.

#### Support matrix: ![CHROME](https://github.com/gullerya/data-tier/raw/master/docs/icons/chrome.png)<sub>61+</sub> | ![FIREFOX](https://github.com/gullerya/data-tier/raw/master/docs/icons/firefox.png)<sub>60+</sub>

#### Performance report: TBD

#### Versions ([full changelog](https://github.com/gullerya/data-tier/blob/master/docs/changelog.md))

* __1.0.3__
  * Fixed [issue no. 15](https://github.com/gullerya/data-tier/issues/15)
  * Improved error handling during elements collection in order to not break the flow due to a single failure

* __1.0.2__
  * Fixed [issue no. 14](https://github.com/gullerya/data-tier/issues/14)

* __1.0.0__
  * First release to hold an ES6 module flavor distribution only (pay attention to the library loading)
  * Fixed view -> model flow for `input` of type `checkbox`
  * Fixed an error in the log where non-tied elements were removed from DOM

## Loading the Library

```javascript
import * as DataTier from 'dist/data-tier.min.js';
```

## Basic concepts

My, definitely opinionated, insights of how client application should look like in general and how `data-tier` library comes into that picture can be found [__here__](https://github.com/gullerya/data-tier/blob/master/docs/client-app-architecture.md). That would probably be the most completed overview of the library's overall usage intent.

#### Tie

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
bands.totalTooltip = 'My hall-of-fame bands';
```
one can create a tie named, say, 'bandsTie', having its data set to the bands array:
```javascript
let bandsDataStore = DataTier.ties.create('bandsTie', bands);
```

and then tie any UI element to it via the tie name and the path:
```html
<span data-tie="bandsTie:length > textContent, bandsTie:totalTooltip > tooltip"></span>

<div>
    <span data-tie="bandsTie:0.albums.1.name => textContent"></span>
    <custom-album-viewer data-tie="bandsTie:0.albums => data"></custom-album-viewer>
</div>
```
where:
* the first item in the path is always the tie's name, having colon separating it from an actual path within the model
* `bandsTie:0` - refer to the whole object at index 0 of our array
* `bandsTie:length` - `length` property, inherited from the native `Array`, may also be used
* `bandsTie:0.name` - path can get deeper...
* `bandsTie:0.albums.1.since` - ...actually, it can get to any level of deepness

Basically, it is possible to create a single dataset for the whole application, making a single 'uber-tie' from it and operating everything from there, but IMHO it would be a bad practice.
Having say that, I'll note, that there is no limitations on the size or the structure complexity of the tied model, nor there are any negative effects of those on application performance.

`Tie` object not only meant to hold the link between the data and its namespace, but also tie's specific configurations/customizations and data management APIs.
For more details see [__API reference__](https://github.com/gullerya/data-tier/blob/master/docs/api-reference.md).

## Extensions

While previous versions of `data-tier` prior to `1.0` were concerned with providing all of the seemingly relevant to MVVM functionalities within the same bundle, present version's approach is different.

I believe, and already outlined that [somewhere else](https://github.com/gullerya/data-tier/blob/master/docs/client-app-architecture.md), that `data-tier` as a framework should serve a single purpose of tying the model with the view in its very basic form: propagating the changes/values to the relevant recipient/s.

Functionalities like `repeater`, `router` and other well known UI paradigms should be provided by **dedicated components**, presumably building on top of `data-tier` framework or any other one.

Having said that, me myself investing some effort in building `data-tier` oriented components. I'll maintain the list below, updating it from time to time (please update me if you have something to add here).
* [`data-tier-list`](https://www.npmjs.com/package/data-tier-list) - repeater-like component to render a list of a similar items based on the single template

## Documentation
[__API__](https://github.com/gullerya/data-tier/blob/master/docs/api-reference.md)

[__Tutorials__](https://github.com/gullerya/data-tier/blob/master/docs/tutorials.md)
