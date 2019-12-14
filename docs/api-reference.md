# API

## Initialization
```javascript
import * as DataTier from './dist/data-tier.min.js';    // align the path with your folders structure
```
`DataTier` variable here becomes a top level library's namespace.
Any JS related functionality will be available through the properties of this object.

## `ties` namespace
Ties (more about `Tie` [below](#tie)) management namespace having the following APIs:
### `const tie = create(key[, model])`
Internally creates a new tie management with the specified (unique) key.
__`Observable`__ model is returned being created (via cloning) from the initially provided one, or an empty object if none provided.
> See more about `Observable`, observation and cloning [here](https://www.npmjs.com/package/object-observer).

Any elements already found in DOM and declared to be tied to it (by key, see HTML syntax [below](#html-tying-declaration)), will be updated immediatelly (synchronously).

* `key` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`, unique
* `model` - optional parameter, which, if provided, MUST be an object/array
* result is an `Observable` object (clone of provided modes or an empty object)
> Attention! If the tie intended to be an `Array`, provide an array (may be empty) as the model upon creation.

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
### `remove(tieToRemove)`
Removes tie.

Tie's model becomes unobserved by the `data-tier` and is revoked if an `Observable` was initially created by `data-tier`.
If `Observable` was provided by hosting application, it remains intact.

If no tie found by the given `tieToRemove`, nothing will happen.

* `tieToRemove` - MUST parameter, may be one of:
  * valid tie key (string matching the pattern `/^[a-zA-Z0-9]+$/`)
  * tie object itself 

```javascript
DataTier.ties.remove('settings');
```

### `get(key)`
Retrieves tie by key.

If no tie found by the given `key`, will return `undefined`.

* `key` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`

```javascript
let settingsTie = DataTier.ties.get('settings');
```

## `HTML` tying declaration
In order to tie **view** (DOM element) to **model** and vice-versa, some declaration in HTML is required.
This declaration is done via element's attribute `data-tie`:

```html
//  explicit syntax
<span data-tie="user:firstName => textContent"></span>

//  shortened syntax (tying to the default target property)
<span data-tie="user:firstName"></span>
```

This declaration ties between span's `textContent` and the property `firstName` of the `userTie`'s model.
* `data-tie` - attribute name, that `data-tier` is looking for when processing the DOM
* `user:` - first part of tied view's parameter is the **tie key** (see above) followed by **colon**
* `firstName` - **path** to the tied property within the tied model; the path can have any depth
* `=>` - arrow (with any number of surrounding spacings) separates **model's** and **view's** 'addresses'
* `textContent` - view's **target property** tied to the given model

>Last item, targeted property, is **optional** (when ommitted, `=>` separator should also be left out).
>Shortened example is shown above.
>When short syntax is used, `DataTier` will resolve the **default** target property, which resolved in the following order:
>* custom default property used if the element has property `defaultTieTarget` defined
>* `value` used for elements `INPUT`, `SELECT`, `TEXTAREA`
>* `src` used for elements `IFRAME`, `IMG`, `SOURCE`
>* `textContent` for the rest

The library scans for such an attributes, parses them and ties to the relevant model/s via relevant ties.

Elements found and processed as valid `data-tier`'s views said to be **tied to** their corresponding tie.
`span` from the example is tied to the `userTie`.

Actual view update happens immediately when:
* tied element just being added to the document, and relevant Tie is already defined
* element's tying definition (attribute value) is being changed and a corresponding Tie is already defined
  * tie definition may be set as an attribute in HTML or setting `element.dataset.tie` property from JS
* new Tie is being created and a pre-tied element is already found in the document
* model's property, that the element is tied to, is being changed

To continue with our example, once the 'user' Tie is defined and the above `span` is added to the document, it's `textContent` will immediately be updated to 'Ploni'.

Let's see more advanced example:

```html
<input type="text" data-tie="user:address.city => value, user:address.country => title">
```

In this case we have a multi-valued tying parameter, one for an element's `value` property and another one for the `title`.
There may be any number of tying values in a multi-valued parameter.
Multi-valued parameter should be separated by some string matching `/\s*[,;]\s*/` (basically `,` [comma] and `;` [semicolon] surrounded by any number of spacings).

Few simple and obvious rules to keep in mind here:

* Same property of a single element MAY NOT be tied more than once
* Several elements and several properties within a single element MAY be tied to the same model's property
