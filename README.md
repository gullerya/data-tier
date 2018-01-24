[![npm version](https://badge.fury.io/js/data-tier.svg)](https://badge.fury.io/js/data-tier)
[![Build Status](https://travis-ci.org/gullerya/data-tier.svg?branch=master)](https://travis-ci.org/gullerya/data-tier)

## Overview

`data-tier` ('tier' from 'to tie') is a two way binding (MVVM) service targeting client (browser) HTML/Javascript applications.
`data-tier.js` relies on an [`Observable`](https://github.com/gullerya/object-observer-js#observable-static-properties)-driven event cycle, having an embedded [`object-observer`](https://github.com/gullerya/object-observer-js) as the default `Observable` provider.

It is possible to provide custom `Observable` implementation. In this case you may want to use lighter `data-tier-wo-oo.js` where `object-observer.js` opted out.

#### Support matrix: ![CHROME](tools/browser_icons/chrome.png) <sub>49+</sub>, ![FIREFOX](tools/browser_icons/firefox.png) <sub>44+</sub>, ![EDGE](tools/browser_icons/explorer.png) <sub>13+</sub>
Support matrix is currently as wide as that of [`object-observer`](https://github.com/gullerya/object-observer-js), assuming that in most of the cases consumers will not provide their own object observer, but will use an embedded one.
`data-tier` supports custom elements as well, obviously this functionality is available only on supporting environments.

#### Versions

__0.6.13__
  - Added `tie-input` OTB processor in other to track an immediate changes in input elements supporting `input` event (types: `text`, `password` of `input` element, `textarea` element).

__0.6.12__
  - Fixed [issue no. 10](https://github.com/gullerya/data-tier/issues/10)
  - Further performance improvements

__0.6.11__
  - Fixed [issue no. 8](https://github.com/gullerya/data-tier/issues/8)
  - Fixed [issue no. 9](https://github.com/gullerya/data-tier/issues/9)
  - Minor performance improvements

__0.6.10__
  - Added a possibility to create/update Tie's data with a plain JS object, in this case `data-tier` will attempt to auto-create and use `Observable` from it, using an embedded `Observable` implementation   
  - Fixed [issue no. 7](https://github.com/gullerya/data-tier/issues/7)

__0.6.9__
  - Conceptually `Rule` has been replaced by `Controller`. There are still no API changes with regard to that, nor any API are yet published, but there will be some refactoring in this area in future releases
  - Fixed [issue no. 6](https://github.com/gullerya/data-tier/issues/6), some performance improvements made for a large scale DOM manipulations

__0.6.8__
  - Fixes: issue no. 2 (smooth handling of an empty values given to the controllers definition), issue no. 4 (non working repeaters on subgraph list), issue no. 5 (improvements of `data-tie-classes`)

__0.6.7__
  - Added a possibility to create a tie without providing any initial data, for early setup with lazy data provisioning

__0.6.5__
  - Fixed a case that element having no dataset breaks the views collection flow (this is not a valid case, but see this [issue](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10790130/#) in Edge, so got to be defensive here)
  -	Added `tieSrc` rule and removed obsolete `tieImage` rule (did the same as `tieSrc`, just in a less general flavor)
  - Added `tieHRef` rule
  - Added `tieClasses` rule

__0.6.0__
  - Moved to `object-observer.js` library as an observation engine, were impacted both the API and the implementation.

__0.5.41__
  - First version, based on native `Object.observe` technology.


## Loading the Library

There are 2 ways to load the library: into a `window` global scope, or a custom scope provided by you.

* Simple reference (script tag) to the `data-tier.js`/`data-tier.min.js` in your HTML will load it into the __global scope__:
```html
<script src="data-tier.min.js"></script>
<script>
	let person = { name: 'Uriya', age: 8 },
	    observablePerson = Observable.from(person);
	DataTier.ties.create('person', observablePerson);
	DataTier.ties.create('settings', {});
</script>
```

* The snippet below exemplifies how to load the library into a __custom scope__ (add error handling as appropriate):
```javascript
let customNamespace = {},
    person = { name: 'Nava', age: 6 },
    observablePerson;

fetch('data-tier.min.js').then(function (response) {
	if (response.status === 200) {
		response.text().then(function (code) {
			Function(code).call(customNamespace);
			
			//	the below code is an example of consumption, locate it in your app lifecycle/flow as appropriate
			observablePerson = customNamespace.Observable.from(person);
			customNamespace.DataTier.ties.create('person', observablePerson);
		});
	}
});
```
- Note the usage of an embedded `Observable` along the way. As it has been mentioned before, you may provide your own `Observable` implementation and in this case more lightweight `data-tier-wo-oo.js`/`data-tier-wo-oo.min.js` may suite you more
- If an embedded `object-observer` employed, it is even more preferable to create the `Tie` from a plain JS object 
- Minified version is also available for both distributions, with and without `object-observer.js`


## Basic concepts

The library utilizes 2 main concepts: __`Tie`__ and __`Controller`__.


#### Tie
__`Tie`__ holds an observable data structure associated with tie's name, it's about __what__ to tie.
Thus, ties serve most and foremost data segregation and management purposes.

Thus, having the following data structure:
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
one can create a tie named, say, 'bandsTie', setting its data to be (an observable clone of) the bands array:
```javascript
let bandsDataStore = DataTier.ties.create('bandsTie', bands);

//  or ...DataTier.ties.create('bandsTie', Observable.from(bands));
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
- the first item in the path is always the tie's name
- `bandsTie.0` - refer to the whole object at index 0 of our array
- `bandsTie.length` - `length` property, inherited from the native `Array`, may also be used
- `bandsTie.0.name` - path can get deeper...
- `bandsTie.0.albums.1.since` - ...actually, it can get to any level of deepness

Basically, it is possible to create a single dataset for the whole application, making a single 'uber-tie' from it and operating everything from there, but it should be considered as a bad practice.
Having say that, I'll note, that there is no limitations on the size or the structure complexity of the tied model, nor there are any negative effects of those on application performance.

`Tie` object not only meant to hold the link between the data and its namespace, but also tie's specific configurations/customizations and data management APIs.
For more details see [__API reference__](docs/api-reference.md).


#### Controller
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

OOTB provided controllers reviewed in the [__Controllers reference__](docs/controllers-reference.md).
This set will eventually be updated and enhanced.

But even more important is the fact, that any custom controllers may be provided by the consuming application.
This can be done at any phase of application's lifecycle, so that there is no special ceremony around it whatsoever.
Controllers' management described in the relevant section in [__API reference__](docs/api-reference.md).

## Documentation
[__Tutorials__](docs/tutorials.md)

[__API reference__](docs/api-reference.md)

[__OOTB Controllers reference__](docs/controllers-reference.md)