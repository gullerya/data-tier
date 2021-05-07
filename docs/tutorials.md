# Intro

Below I'll exemplify a usage of `data-tier` with a very simple cases, going from simplest to more involved ones. Each of those supplied with a link to CodePen for further exploration.

## One way - primitive

> Note: when speaking about one way binding here, it is always assumed 'model to view' way.

[CodePen - tutorial 1](https://codepen.io/gullerya/pen/YzZPZmr)

First, let's create things and see them tied:

```html
<span data-tie="tutorial1"></span>
```

```js
import { ties } from 'https://libs.gullerya.com/data-tier/3.1.6/data-tier.js';

ties.create('tutorial1', 'Simple primitive text');
```

`tutorial1` is the __tie key__.
__Tie__ is a model managing object.
There can be as many ties as needed, each identified by its unique key.

Tying declaration, as in the `span` above, will always refer to the tie/s by key.

Usually, model is much more complicated than just a primitive, that is the next example.

## One way - nested in object

[CodePen - tutorial 2](https://codepen.io/gullerya/pen/mdWymwG)

```html
<span data-tie="tutorial2:address.city"></span>
```

Here tie key is followed by colon (`:`) and a path into the model's object tree.

```js
import { ties } from 'https://libs.gullerya.com/data-tier/3.1.6/data-tier.js';

const model = ties.create('tutorial2', {
	name: 'Aya Guller',
	address: {
		country: 'Dreamland',
		city: 'Wonders'
	}
});
```

We've also obtained a reference to `model`, an __observed clone__ of the initial data.
Any changes to model will be immediatelly reflected in the tied view/s, see the CodePen linked above to see that in action.

## Two way - implicit defaults

[CodePen - tutorial 3](https://codepen.io/gullerya/pen/wvJBeWK)

```html
<input data-tie="tutorial3:status">
<br>
<span data-tie="tutorial3:status"></span>
```

We've added an `input` element in this example, having a good occasion to introduce __target property__ concept, the property on the element that the tied data will be assigned to.

In case of `span` (and actually vast majority of DOM elements) target property defaults to `textContent`. Input elements (`input`, `textarea`, `select`) are defaulted to `value`.

```js
import { ties } from 'https://libs.gullerya.com/data-tier/3.1.6/data-tier.js';

const model = ties.create('tutorial3', {
	status: 'better than ever'
});
```

Please, change the value of the input box and __press Enter__.

We see another default mechanism triggered for the `input` element (as well `textarea`, `select`, see [documentation](api-reference.md)) - `data-tier` listens on `change` event and reflects the value back to the model.

`change` event is triggered only on focusing away, which is okay for most of the use cases, but `input` event is much more interesting for the tutorial examples.

## Two way - explicit declaration

[CodePen - tutorial 4](https://codepen.io/gullerya/pen/abJzwQX)

```html
<input data-tie="tutorial4:status => value => input">
<br>
<span data-tie="tutorial4:status"></span>
```

Most important part here is 2 explicit declarations in `input` element:
- '`=> value`' means that data should be targeted to a `value` property of the element
- '`=> input`' means that `data-tier` should listen to `input` event to sync data back to model

Fast forwarding to the whole vision of the `data-tier`, data can be tied from whatever model to whateven view's property and optionally synced back by whatever event.

```js
import { ties } from 'https://libs.gullerya.com/data-tier/3.1.6/data-tier.js';

const model = ties.create('tutorial4', {
	status: 'better than ever'
});
```

Albeit a micro example, but this is the whole essence of the full data binding lifecycle!