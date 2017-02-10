[![npm version](https://badge.fury.io/js/data-tier.svg)](https://badge.fury.io/js/data-tier)
[![Build Status](https://travis-ci.org/gullerya/data-tier.svg?branch=master)](https://travis-ci.org/gullerya/data-tier)

# Summary

`DataTier` ('tier' from 'to tie') is a service oriented framework, that provides two way binding (Model-View - View-Model, aka MVVM) in the domain of client HTML/Javascript applications.
This library works tightly with [`Observable`](https://github.com/gullerya/object-observer-js#observable-static-properties)-driven event cycle, therefore it comes with an embedded [`object-observer.js`](https://github.com/gullerya/object-observer-js) library.

Yet, it is possible to provide any other `Observable` implementation, if it provides the same functionality. In this case you may want to use lighter `data-tier` distribution (bundled within the same npm module) without `object-observer.js`.

#### Support matrix: ![CHROME](tools/browser_icons/chrome.png) <sub>49+</sub>, ![FIREFOX](tools/browser_icons/firefox.png) <sub>42+</sub>, ![EDGE](tools/browser_icons/explorer.png) <sub>13+</sub>
Support matrix is currently as wide as that of [`object-observer.js`](https://github.com/gullerya/object-observer-js), assuming that in most of the cases consumers will not provide their own object-observer, but will use an embedded one.
`DataTier` supports custom elements as well, obviously this functionality is available only on supporting environments.

#### Backlog:

- Support custom pre-processors for both data-to-view and view-to-data flows
- Add rule to change any arbitrary attribute
- Add rule for action (mouse? keyboard? any and provide the action with the event data?)
- API reference

#### Versions

- __0.6.6__
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
	var person = { name: 'Uriya', age: 8 },
	    observablePerson = Observable.from(person);
	DataTier.ties.create('person', observablePerson);
</script>
```

* The snippet below exemplifies how to load the library into a __custom scope__ (add error handling as appropriate):
```javascript
var customNamespace = {},
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

The library works by means of 2 main concepts __Ties__ and __Rules__.

###	Tie
__Tie__ holds an observable data structure (object or array) associated with tie's name.
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
	},
	...
];
```
Now one can create a tie named 'bandsTie' and set its data to be (an observable clone of) the bands array.
Having that, any UI element would be tied to this dataset via the tie name and the path:
- `bandsTie.length` - `length` inherited from the native `Array`
- `bandsTie.0` - refer to the whole object at index 0 of our array
- `bandsTie.0.name`
- `bandsTie.0.albums.1.since` - it can get to any level of deepness
The first item in the path is always the tie's name, after that are coming the keys of the model.

One could create a single dataset for the whole application, make a single 'uber-tie' from it and operate all of the 

### Rule
__Rule__ 

# Basic example

In essence, the purpose of the `DataTier` service is to tie model and view and sync between them automatically once changes detected in either one or another.

In order to let this happen, two actions need to be done:
1. any model to be shown should be registered in the `DataTier` service
2. DOM elements intended to visualize the model need to be decorated with an appropriate declaration

The above two may happen in any order, in any phase in the application lifecycle. `DataTier` supports lazy binding, watching for DOM changes as well as for a data changes and will pick up any new linking information relevant and tie the things up.

Let's review the actual example, where we have some `user` object which is our model and we want to bind it to some interactive view of it.

### Code part
```javascript
var user = {
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
	<span data-tie-text="userInfo:name"></span>
	<span data-tie-text="userInfo:age"></span>
	<input type="checkbox" data-tie-value="userInfo:active">
	<div>
		<input type="text" data-tie-value="userInfo:address.street">
		<input type="text" data-tie-value="userInfo:address.apartment">
	</div>
</div>
```


For an extended tutorial see [Tutorial](tutorial.md) page.
For a more thorough API documentation see [API Reference](api-reference.md) page.
