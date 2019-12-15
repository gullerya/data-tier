# Lifecycle

Understanding of a lifecycle is crucial in an MVVM designs, therefore I decided to give it a full attention.
Key notes to take:
- `data-tier` is handling all of the application lifecycle possibilities, so views may be set up before the model or vice versa
- there is an ongoing observation of both: the model and the view, all the changes reflected correspondingly
- JavaScript (model) driven flows are synchronous; the DOM (views) originating changes are asynchronous

## Definitions

I'll start with definition of 2 basic processes: __view detection and processing__ and __document processing__.

### A. View detection and processing
`data-tier`'s __view__ is simply any DOM element that has `data-tie` attribute defined (either by HTML definition or by setting its `dataset.tie` property).

Henceforce, any mention of `view` term is according to the above statement.

Any time library processes a view, the following steps are taken:
- `data-tie` attribute is parsed and preprocessed for a performant future use
- element is being updated to the relevant value/s, if the corresponding tie/s is/are already defined
- if relevant, change event listener is added (see below more about this)
- view is added to some internal data structure for a performant future use
- if the element is not yet defined, its processing postponed via `whenDefined`
- if the element is a document root (iFrame, shadow DOM), its inner document undergoes __document processing__

### B. Document processing
Document processing consists of:
- initialization of `MutationObserver` to track the changes:
	- Any add/remove of child nodes (and their nested tree) tracked. They are flattened, checked for being a view and then either tied or untied, according to the type of event
	- `data-tie` attributes are tracked too. The effect of it is either turning an element into a view (tying) or untying or changing the tie - all according to the attribute's value change
- traversal of DOM for detection and processing of the views

## Init phase

When the `data-tier` is imported, it immediatelly performs __document processing__ of the current document.

## Event loop phase

When init phase is done, the library enters event loop 'dream'. It will react on 3 kind of events:
- JavaScript driven changes to ties
- DOM mutations
- View-to-Model change events

Let's detail each of those flows.

### A. Ties (model) changes

When a new tie is added or an existing tie's model is being changed, in both cases one thing happens: `data-tier` looks up for any relevant views and updates them accordingly.

The lookup is performed on the internal data structures, it is very fast.

This part of the flow is __synchronous__.

Example. Assuming, that we already have this HTML in the document:
```html
<span class="display-name" data-tie="currentUser:displayName"></span>
```
the following JS will play right:
```javascript
console.log(document.quereSelector('.display-name').textContent);
//	empty string

const currentUser = DataTier.ties.create('currentUser', {
	displayName: 'Aya Guller'
});

console.log(document.quereSelector('.display-name').textContent);
//	Aya Guller - adding the tie is updating the views

currentUser.displayName = 'Nava Guller';

console.log(document.quereSelector('.display-name').textContent);
//	Nave Guller - changes to model are updating the views
```

Obviously, if there are many elements with the same `data-tie` definition - all of them are updated at the same time.

Note: removal of a tie (`DataTier.ties.remove('currentUser')` as in out example) __will NOT__ reset the views, they will stay in their last state. In order to reset the view an explicit reset of model is required (`currentUserModel.displayName = null` for example). Of course, reassigning the model's reference (`currentUserModel = null`) won't do anything either.

### B. DOM (views) mutations

As we've seen above, DOM mutations are being observed and any change relevant to `data-tier` is being processed.

Addition of the new views to the DOM gets them updated (if the corresponding model is already defined, of course). Removal of the views from the DOM has mostly some internal effect. Updating views' `data-tie` definitions gets them updated as well.

This part of the flow is __asynchronous__.

Example. Assuming, that the following JS has already run:
```javascript
const nextToGo = DataTier.ties.create('nextToGo', {
	type: 'desert',
	name: 'Negev'
});
```
the following JS will play right:
```javascript
const e = document.createElement('span');
e.dataset.tie = 'nextToGo:name';
document.body.appendChild(e);

console.log(e.textContent);
//	empty string - we shall wait next microtask to see the changes

await new Promise(r => setTimeout(r, 0));

console.log(e.textContent);
//	Negev - added elements are processed and if detected as view - updated

e.dataset.tie = 'nextToGo:type'

await new Promise(r => setTimeout(r, 0));

console.log(e.textContent);
//	desert - 'data-tie' attribute mutations observed and processed too
```

### C. View-to-Model changing events

As per API definition, `data-tier` will consider a view valid for bi-directional tying (read View-to-Model, since Model-to-View is always valid) if:
- there is a property `changeEventName` defined on the view and returning a non-empty string
- view is one of the prescripted defaults: `input`, `select`, `textarea`; their default change event name is `change`, unless redefined as per punkt (1) above

Before continue, it is important to mention here another concept - `defaultTieTarget`. Similarly to the change event name, the default tie target resolved as:
- a non-empty empty string of `defaultTieTarget` property, if defined on the view
- otherwise - default, which is `textContent` for vast majority of the elements except:
	- `value`	for `input`, `select`, `textarea`
	- `checked`	for `input` of type `checkbox`
	- `src` for `img`, `iframe`, `source`

Having understand this, the rest is really easy.

When view is processed and found valid for bi-directional tying, `data-tier` adds a change event listener on the said event.

When the view raises the event, listener gets the value from the default tie target property and sets it onto model.

This part of flow is __asynchronous__ too.

Example. Assuming, that the following HTML is found in the document:
```html
<input class="age" data-tie="currentUser:age">
```
we can state, that:
- this input element is considered to be a valid `data-tier`'s view
- it is also perfectly valid for bi-directional tying
- its default tie target property is `value`
- `data-tier` will be listening on `change` event for View-to-Model changes

Now we can play with it like this:
```javascript
const v = document.querySelector('.age');
const currentUser = DataTier.ties.create('currentUser', {
	age: 4
});

console.log(v.value);
//	4

v.value = 5;
console.log(currentUser.age);
//	4 - JavaScript changes of inputs' value are not raising 'change' event natively

v.dispatchEvent(new Event('change'));

await new Promise(r => setTimeout(r, 0));

console.log(currentUser.age);
//	5 - after an async await 'data-tier' will be notified of change and reflect the new value in the model
```