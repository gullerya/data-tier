# API

> This page describes `data-tier`'s APIs as they are in the library's ES6 module distribution.
Old APIs are effectively deprecated from 0.6.19.

### Initialization
```javascript
import * as DataTier from 'dist/module/data-tier.min.js';
```
`DataTier` variable here becomes a top level library's namespace.
Any JS related functionality will be available through the properties of this object.

### `ties` namespace
Ties (more about `Tie` [below](#tie)) management namespace having the following APIs:
##### `create(name, [model])`
Creates a new tie with the specified (unique) name.
Updates any elements already found in DOM and tied to it (by name, see HTML syntax [below](#html-tying-declaration)).
Sets up model's observer, which will immediately reflect any changes in the tied views.

* `name` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`, unique
* `model` - optional parameter, which, if provided, MUST be an object
* result is a `Tie` object or Error if any of the above requirements is not fulfilled

```javascript
let user = {
        firstName: 'Ploni',
        lastName: 'Almoni',
        address: {
            country: 'Utopia',
            city: 'Dreamcity'
        }
    },
    userTie = DataTier.ties.create('user', user),
    settingsTie = DataTier.ties.create('settings');
```
##### `remove(name)`
Removes tie by name.

Tie's model becomes unobserved by the `data-tier` and is revoked if an `Observable` was initially created by `data-tier`.
If `Observable` was provided by hosting application, it remains intact.

If no tie found by the given `name`, nothing will happen.

* `name` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`

```javascript
DataTier.ties.remove('settings');
```

##### `get(name)`
Retrieves tie by name.

If no tie found by the given `name`, will return `undefined`.

* `name` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`

```javascript
let settingsTie = DataTier.ties.get('settings');
```

### `Tie`
Tie is a binding unit between the model and the views tied to it (by name, see HTML syntax [below](#html-tying-declaration)).


### `HTML` tying declaration
In order to tie **view** (DOM element) to **model** and vice-versa, some declaration in HTML is required.
This declaration is done via element's attribute `data-tie`:

```html
<span data-tie="user:firstName => textContent"></span>
```

This declaration ties between span's `textContent` and the property `firstName` of the `userTie`'s model. To break it to the parts:
* `data-tie` - attribute name, that `data-tier` is looking for when processing the DOM
* `user:` - first part of tied view's parameter is the **tie name** (see above) followed by **colon**
* `firstName` - **path** to the tied property within the tied model; the path can have any depth
* `=>` - arrow (with any number of surrounding spacing characters) separates **model's source** from **view's target** property
* `textContent` - view's **target property** tied to the given model

The library scans for such an attributes, parses then and ties to the relevant model/s via relevant ties.

Elements found and processed as valid `data-tier`'s views said to be **tied to** their corresponding tie.
`span` from the example is tied to the `userTie`.

Actual view update happens immediately when (using 'user' tie as example):
* tied element just being added to the document, and 'user' Tie is already defined
* element's tying definition (attribute value) is being changed and a corresponding Tie is already defined
  * tie definition may be set as an attribute in HTML or setting `element.dataset.tie` property from JS
* 'user' Tie is being created and a tied element is already found in the document
* model's property that the element is tied to is being changed

To continue with our example, once the 'user' Tie is defined and the above `span` is added to the document, it's `textContent` will immediately be updated to 'Ploni'.

Let's see more advanced example:

```html
<input type="text" data-tie="user:address.city => value, user:address.country => title">
```

In this case we have a multi-valued tying parameter, one for an element's `value` property and another one for the `title`.
Few simple and obvious rules to keep in mind here:

* Same property of a single element MAY NOT be tied more than once
* Several elements and several properties within a single element MAY be tied to the same model's property

