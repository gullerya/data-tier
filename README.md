[![npm version](https://badge.fury.io/js/data-tier.svg)](https://badge.fury.io/js/data-tier)
[![Build Status](https://travis-ci.org/gullerya/data-tier.svg?branch=master)](https://travis-ci.org/gullerya/data-tier)

# Summary <img src="https://raw.githubusercontent.com/gullerya/data-tier/master/data-tier-logo.svg"/>

`DataTier` ('tier' from 'to tie') is a service oriented framework, that provides two way binding (Model-View - View-Model, aka MVVM) in the domain of client HTML/Javascript applications.
This library works tightly with [`Observable`](https://github.com/gullerya/object-observer-js#observable-static-properties)-driven event cycle, therefore it comes with an embedded [`object-observer.js`](https://github.com/gullerya/object-observer-js) library.

Yet, it is possible to provide any other `Observable` implementation, if it provides the same functionality. In this case you may want to use lighter `data-tier` distribution (bundled within the same npm module) without `object-observer.js`.

#### Support matrix: ![CHROME](https://raw.githubusercontent.com/gullerya/data-tier/master/tools/browser_icons/chrome.png) <sub>49+</sub>, ![FIREFOX](https://raw.githubusercontent.com/gullerya/data-tier/master/tools/browser_icons/firefox.png) <sub>42+</sub>, ![EDGE](https://raw.githubusercontent.com/gullerya/data-tier/master/tools/browser_icons/explorer.png) <sub>13+</sub>
Support matrix is currently as wide as that of [`object-observer.js`](https://github.com/gullerya/object-observer-js), assuming that in most of the cases consumers will not provide their own object-observer, but will use an embedded one.

#### Backlog:


#### Versions
- __0.6.0__
  - Moved to `object-observer.js` library as an observation engine, were impacted both the API and the implementaion.
- __0.5.41__
  - First version, based on native `Object.observe` technology.


# Loading the Library

You have 2 ways to load the library: into a `window` global scope, or a custom scope provided by you.

* Simple reference (script tag) to the `data-tier.js` in your HTML will load it into the __global scope__:
```html
<script src="data-tier.js"></script>
<script>
	var person = { name: 'Uriya', age: 8 },
	    observablePerson = window.Observable.from(person);
	window.DataTier.ties.create('person', observablePerson);
</script>
```

* Following loader exemplifies how to load the library into a __custom scope__ (add error handling as appropriate):
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


# Basic example

In essence, the purpose of the `DataTier` service is to tie model and view and sync between them automatically once changes detected in either one or another.

In order to let this happen, two actions need to be done:
1. any model to be shown should be registered in the `DataTier` service
2. DOM elements intended to visualize the model need to be decorated with an appropriate declaration

The above two may happen in any order, in any phase in the application lifecycle. `DataTier` supports lazy binding, watching for DOM changes as well as for a data changes and will pick up any new linking information relevant and tie the things up.

Let's review the actual example, where we have some `user` object which is our model and we want to bind it to some interactive view of it.

### Functional part
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
observableUser = window.Observable.from(user);

window.DataTier.ties.create('userInfo', observableUser);
```

### Declarative part
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

TBD...

For a more thorough API documentation see [API Reference](api_reference.md) page.
