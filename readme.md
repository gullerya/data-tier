[![GitHub](https://img.shields.io/github/license/gullerya/data-tier.svg)](https://github.com/gullerya/data-tier)
[![Travis](https://img.shields.io/travis/gullerya/data-tier.svg)](https://travis-ci.org/gullerya/data-tier)
[![NPM](https://img.shields.io/npm/v/data-tier.svg?label=npm%20data-tier)](https://www.npmjs.com/package/data-tier)

## Overview

`data-tier` ('tier' from 'to tie') is a two way binding (MVVM) service targeting client (browser) HTML/Javascript applications.
`data-tier` relies on an [`Observable`](https://github.com/gullerya/object-observer/blob/master/docs/observable.md)-driven event cycle, having an embedded [`object-observer`](https://github.com/gullerya/object-observer) as the default `Observable` provider.

> In future I may consider allowing provision of custom `Observable` implementation if there will be any interest in it.

#### Support matrix: ![CHROME](https://github.com/gullerya/data-tier/raw/master/docs/icons/chrome.png)<sub>61+</sub> | ![FIREFOX](https://github.com/gullerya/data-tier/raw/master/docs/icons/firefox.png)<sub>60+</sub> | ![EDGE](https://github.com/gullerya/data-tier/raw/master/docs/icons/edge.png)<sub>16+</sub>

#### Performance report: TBD

#### Versions ([full changelog](https://github.com/gullerya/data-tier/blob/master/docs/changelog.md))

* __0.6.25__
  * Fixed [issue no. 13](https://github.com/gullerya/data-tier/issues/13)

* __0.6.21__
  * initial provisioning of `data-tier` as ES6 module
  * new API defined and implemented in ES6 module distribution

* __0.6.19__
  * Fixed incorrect behavior when `tie-property` configured on the element **after** it was added to the DOM

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
* `bandsTie.0` - refer to the whole object at index 0 of our array
* `bandsTie.length` - `length` property, inherited from the native `Array`, may also be used
* `bandsTie.0.name` - path can get deeper...
* `bandsTie.0.albums.1.since` - ...actually, it can get to any level of deepness

Basically, it is possible to create a single dataset for the whole application, making a single 'uber-tie' from it and operating everything from there, but IMHO it would be a bad practice.
Having say that, I'll note, that there is no limitations on the size or the structure complexity of the tied model, nor there are any negative effects of those on application performance.

`Tie` object not only meant to hold the link between the data and its namespace, but also tie's specific configurations/customizations and data management APIs.
For more details see [__API reference__](https://github.com/gullerya/data-tier/blob/master/docs/api-reference.md).


## Documentation
[__New `data-tier`__](https://github.com/gullerya/data-tier/blob/master/new-readme.md)

[__Tutorials__](https://github.com/gullerya/data-tier/blob/master/docs/tutorials.md)
