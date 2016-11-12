# Loading the Library

You have 2 ways to load the library: into a `window` global scope, or a custom scope provided by you.

* A simple reference (script tag) to the `data-tier.js` in your HTML will load it into the __global scope__:
```html
<script src="data-tier.js"></script>
<script>
	var person = { name: 'Uriya', age: 8 },
	    observablePerson = Observable.from(person);

	window.DataTier.ties.create('person', observablePerson);
</script>
```

* The following loader exemplifies loading the library into a __custom scope__ (add error handling as appropriate):
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

Please pay attention, that the above examples use the distribution which includes embedded [`object-observer.js`](https://www.npmjs.com/package/object-observer) library.
If you have your own [`Observable`](https://github.com/gullerya/object-observer-js#observable-static-properties) implementation, you may want to consume `data-tier-wo-oo.js` distribution, which is without `object-observer.js` and thus thinner. `data-tier.js` does not uses directly the `Observable`, but the changes notifications are expected to be delivered in the exact way as it is outlined in the above API reference.
To be sure both, the full version with `object-observer.js` and the thin one without it are available in the minified flavor too.

# APIs
