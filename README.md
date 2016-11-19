[![npm version](https://badge.fury.io/js/data-tier.svg)](https://badge.fury.io/js/data-tier)
[![Build Status](https://travis-ci.org/gullerya/data-tier.svg?branch=master)](https://travis-ci.org/gullerya/data-tier)

# Summary

DataTier ('tier' from 'to tie') is a service oriented framework, that provides two way binding (Model-View - View-Model, aka MVVM) in the domain of client HTML/Javascript applications.
This library works tightly with [`Observable`](https://github.com/gullerya/object-observer-js#observable-static-properties)-driven event cycle, therefore it comes with an embedded [object-observer.js](https://github.com/gullerya/object-observer-js) library.

Yet, it is possible to provide any other `Observable` implementation, if it provides the same functionality. In this case you may want to import lightweigth `data-tier` distribution (bundled within npm module as well) without `object-observer.js`.

#### Support matrix: ![CHROME](https://raw.githubusercontent.com/alrra/browser-logos/master/chrome/chrome_24x24.png) <sub>49+</sub>, ![FIREFOX](https://raw.githubusercontent.com/alrra/browser-logos/master/firefox/firefox_24x24.png) <sub>42+</sub>, ![EDGE](https://raw.githubusercontent.com/alrra/browser-logos/master/edge/edge_24x24.png) <sub>13+</sub>
Support matrix is currently as wide as that of [object-observer.js](https://github.com/gullerya/object-observer-js), assuming that in most of the cases consumers will not provide their own object-observer, but will use an embedded one.

#### Backlog:


#### Versions
- __0.6.0__
  - Since native `Object.observe` was deprecated and removed, moved to `object-observer.js` library as an observation engine. This has impact on both the API and the implementaion.
- __0.5.41__
  - First version, based on native `Object.observe` technology.


# Loading the Library

You have 2 ways to load the library: into a `window` global scope, or a custom scope provided by you.

* Simple a reference (script tag) to the `data-tier.js` in your HTML will load it into the __global scope__:
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


# Basic examples

Let's assume you have and object that holds user info and you want to bind it to it's view in HTML. This splits into the <b>declaration in the HTML</b> and <b>functional part in the Javascript</b>.<br>
In Javascript you'll need to tell to DataTier that the object 'user' is to be tied to it's views and watched for changes. This is done using API as in the following example (let's assume that you've got the reference to the library in 'dataTier' variable; see full description in [API Reference](api_reference.md)):

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

The API to register an object/graph in the DataTier is `ties.create` function which accepts 2 parameters: namespace as a string and initial data as an object.<br>
In order to have a views bound to this data we need to declare the ties in HTML also, it will go as following:

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

Don't be confused with the diversity of variants of `data` attributes - this is something to do with a concept of <b>rules</b> and will be covered later in docs, the main point here is that DOM elements are being tied to the data registered in DataTier by means of `data` attributes with <b>path</b> values, which i also expand on in the documentation below.
There is no importance of the order of things, Javascript part may run before the HTML declarations and an opposite. HTML chunks with binding attributes may be injected/built later on, say on dynamic rendering of the pages.
Similarly, Javascript tying may be done as part of any later async flow, as well as untying in the case of need, to be sure.

Once two contracts exemplified above are done, you have the following:
<ul>
	<li>Any change in the data itself (model) will be reflected in all tied views</li>
	<li>Any change of values in input elements which invoke 'onchange' event (user driven changes, usually, but may be simulated from Javascript code as well, of course) will be reflected in the model, and propagate to all the relevant views</li>
	<li>Adding new HTML chunks having data ties setup will automatically pick up and reflect the model state</li>
	<li>Adding new data to the namespace or registering new namespaces with data will invode update of all the view waiting for that data</li>
</ul>

For a more thorough API documentation see [API Reference](api_reference.md) page.
