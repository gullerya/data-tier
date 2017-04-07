[![npm version](https://badge.fury.io/js/data-tier.svg)](https://badge.fury.io/js/data-tier)
[![Build Status](https://travis-ci.org/gullerya/data-tier.svg?branch=master)](https://travis-ci.org/gullerya/data-tier)

# Summary

`DataTier` ('tier' from 'to tie') is a service oriented framework, that provides two way binding (Model-View - View-Model, aka MVVM) in the domain of client HTML/Javascript applications.
This library works tightly with [`Observable`](https://github.com/gullerya/object-observer-js#observable-static-properties)-driven event cycle, therefore it comes with an embedded [`object-observer.js`](https://github.com/gullerya/object-observer-js) library.

Yet, it is possible to provide any other `Observable` implementation, if it provides the same functionality. In this case you may want to use lighter `data-tier` distribution (bundled within the same npm module) without `object-observer.js`.

#### Support matrix: ![CHROME](tools/browser_icons/chrome.png) <sub>49+</sub>, ![FIREFOX](tools/browser_icons/firefox.png) <sub>44+</sub>, ![EDGE](tools/browser_icons/explorer.png) <sub>13+</sub>
Support matrix is currently as wide as that of [`object-observer.js`](https://github.com/gullerya/object-observer-js), assuming that in most of the cases consumers will not provide their own object-observer, but will use an embedded one.
`DataTier` supports custom elements as well, obviously this functionality is available only on supporting environments.

#### Backlog:

- Support custom pre-processors/interceptors for both data-to-view and view-to-data flows
- Add rule to change any arbitrary attribute
- Add rule for action (mouse? keyboard? any and provide the action with the event data?)
- API reference
- Possibility to override global rules on tie level
- Change rule detection and appliance inner interface to broaden the possibilities of rules configurations

#### Versions

- __0.6.7__
  - Added a possibility to create a tie without providing any initial data, for early setup with lazy data provisioning

- __0.6.5__
  - Fixed a case that element having no dataset breaks the views collection flow (this is not a valid case, but see this [issue](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10790130/#) in Edge, so got to be defensive here)
  -	Added `tieSrc` rule and removed obsolete `tieImage` rule (did the same as `tieSrc`, just in a less general flavor)
  - Added `tieHRef` rule
  - Added `tieClasses` rule

- __0.6.0__
  - Moved to `object-observer.js` library as an observation engine, were impacted both the API and the implementation.

- __0.5.41__
  - First version, based on native `Object.observe` technology.


# Loading the Library

You have 2 ways to load the library: into a `window` global scope, or a custom scope provided by you.

* Simple reference (script tag) to the `data-tier.js` in your HTML will load it into the __global scope__:
```html
<script src="data-tier.js"></script>
<script>
	let person = { name: 'Uriya', age: 8 },
	    observablePerson = Observable.from(person);
	DataTier.ties.create('person', observablePerson);
</script>
```

* The snippet below exemplifies how to load the library into a __custom scope__ (add error handling as appropriate):
```javascript
let customNamespace = {},
    person = { name: 'Nava', age: 6 },
    observablePerson;

fetch('data-tier.js').then(function (response) {
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
- Note the usage of an embedded `Observable` along the way. As it has been mentioned before, you may provide your own `Observable` implementation and in this case more lightweigth `data-tier-wo-oo.js` will suite you more.
- Minified version is also available for both distributions, with and without `object-observer.js`.


# Base concepts

The library utilizes 2 main concepts __Ties__ and __Rules__.

###	Tie
__Tie__ holds an observable data structure (object or array) associated with tie's name, it's about __what__ to tie.
Thus, ties serve most and foremost data segregation and management purposes.

Data within a tie is referenced by __path__: dot (`.`) separated keys along the object's hierarchy where in case of arrays index being the key. Consider the following data structure:
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
Now one can create a tie named 'bandsTie' and set its data to be (an observable clone of) the bands array.
Having that, any UI element would be tied to this dataset via the tie name and the path:
- `bandsTie.0` - refer to the whole object at index 0 of our array
- `bandsTie.length` - `length` property, inherited from the native `Array`, may also be used
- `bandsTie.0.name` - path can get deeper...
- `bandsTie.0.albums.1.since` - ...actually, it can get to any level of deepness

Important: the first item in the path is always the tie's name.

Basically, it is possible to create a single dataset for the whole application, making a single 'uber-tie' from it and operating everything from there, but it should be considered as a bad practice.
Having say that, I'll note, that there is no limitations on the size or the structure complexity of the tied model, nor there are any negative effects of those on application performance.

Tie object not only meant to hold the link between the data and its namespace, but also tie's specific configurations and customizations.
Currently in the backlog there are such a features like supporting custom interceptors for both flows - data-to-view and view-to-data.
Those features are under ongoing development and enhancements. For more details see [__API reference__](api-reference.md).

### Rule
__Rule__ is a definition of presentation logic, it's about __how__ to vizualize the data.

Each rule has it's own unique name given to it upon registration.
Rules are applied via the DOM's `data-*` attributes joining the `data-` prefix with rule's name: `data-tie-text` applies the rule 'tieText'.
Let's see the following example:
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
In the first part we tie between the `span` (view) and the model (we have tied it to both, `length` and `totalTooltip` values), while using 2 rules to say, how the value will be visualized.
Attributes' values (`bandsTie.length`, `bandsTie.totalTooltip`) are rules' configurations for this specific instance and their syntax/content is part of each rule's API.
In most cases the tie name and the path to the data would be sufficient, but conceptually rule's configuration may be anything rule needs.

Thus, in the second part a `template` element tied by a 'tieList' rule. This rule expects more rich content in its configuration: tie name and path for sure, but also some name for an item within iteration (here - 'album', and see its usage in the inner span element).

There is a set of rules bundled with the library, they are described in the [__Rules reference__](rules-reference.md).
This set will eventually be updated and enhanced upon a needs and feedbacks from real world usages.
But even more important is the fact, that rules may be created and added by a consuming application.
This can be done at any phase of application's lifecycle, so there is no special ceremony around it whatsoever.
Rules management described in the relevant section in [__API reference__](api-reference.md).


# Basic example

In essence, the purpose of the `DataTier` service is to tie model and view and sync between them automatically once changes detected in either one or another.

In order to make this happen, two things need to be done:
- any model to be shown should be registered in the `DataTier` service
- DOM elements intended to visualize the model need to be decorated with an appropriate declaration

The above two may happen in any order, in any phase in the application lifecycle. `DataTier` supports lazy binding, watching for DOM changes as well as for a data changes and will pick up any new linking information relevant and tie the things up.

Let's review the actual example, where we have some `user` object which is our model and we want to bind it to some interactive view of it.

### Code part
```javascript
let user = {
	name: 'User Name',
	age: 7,
	active: true,
	address: {
		street: 'Some street',
		apartment: 15
	}
},
observableUser = Observable.from(user);

DataTier.ties.create('userInfo', observableUser);
```

### HTML part
```html
<div>
	<span data-tie-text="userInfo.name"></span>
	<span data-tie-text="userInfo.age"></span>
	<input type="checkbox" data-tie-value="userInfo.active">
	<div>
		<input type="text" data-tie-value="userInfo.address.street">
		<input type="text" data-tie-value="userInfo.address.apartment">
	</div>
</div>
```


For an extended tutorial see [__this__](tutorial.md) page.

For a more thorough API documentation see [__API Reference__](api-reference.md).
