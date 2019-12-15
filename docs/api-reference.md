# API

Here I'll detail the API, which splits into the __functional__ (JS) part and the __declarative__ tying syntax found in HTML.

While Model-to-View data flow is pretty simple and straightforward, the opposite direction, View-to-Model, relys on some pre-conditions. I'll touch this part below as well.

Beside the actual API's signatures, there is much of importance of understaning `data-tier`'s lifecycle and its runtime capabilities/limitations. See [Lifecycle](./lifecycle.md) documentation dedicated just to that part.

> In the snippets below I'll assume, that the following statement was used to import the library: `import * as DataTier from './dist/data-tier.min.js';`

## JavaScript - model definitions and operations
Imported `DataTier` object has `ties` object defined on it:
> `typeof DataTier.ties === 'object';   //  true`

`ties` is a data management namespace, holding the following APIs:

1. `const tie = DataTier.ties.`__`create(key[, model]);`__

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

2. `DataTier.ties.`__`remove(tieToRemove);`__

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

3. `const tie = DataTier.ties.`__`get(key);`__

Retrieves tie by key.

If no tie found by the given `key`, will return `undefined`.

* `key` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`

```javascript
let settingsTie = DataTier.ties.get('settings');
```

## `HTML` - tying declaration
In order to tie a __view/s__ (some DOM element/s) to __model__, a declaration in HTML is required.
This declaration is done via element's attribute `data-tie`:

```html
//  explicit syntax
<span data-tie="user:firstName => textContent"></span>

//  shortened syntax (tying to the default target property)
<span data-tie="user:firstName"></span>
```

or via the corresponding `dataset` property:

```javascript
const vEl = document.querySelector('.field .first-name');
vEl.dataset.tie = 'user:firstName';
```

This declaration ties between span's `textContent` and the property `firstName` of the `userTie`'s model. Let's review the declaration syntax parts:
* `data-tie` - attribute name; `data-tier` library is looking for those when processing the DOM; those properties are also observed for mutations in runtime reflecting and change in the view
* `user:` - first part of tied view's parameter is the __tie key__ followed by the __`:`__ character (colon)
* `firstName` - path to the __source property__ within the tied model; path can be of any depth (__`.`__ (dot) separated nodes)
* `=>` - fat arrow (with none/any spaces around) separates __model's__ and __view's__ addresses
* `textContent` - view's __target property__ tied to the given model; as of now, this part may only be of a depth of 1 (flat)

>Last item, targeted property, is __optional__ (when ommitted, `=>` separator should also be left out).
>Shortened example is shown above.
>When short syntax is used `DataTier` will resolve the target property in the following sequence:
>* custom default property used if the element has `defaultTieTarget` property defined and returning a non-empty string
>* else `value` if element is `INPUT`, `SELECT`, `TEXTAREA`
>* else `src` if element is `IFRAME`, `IMG`, `SOURCE`
>* else `textContent`

Elements found and processed as valid `data-tier`'s views said to be __tied to__ their corresponding tie, so we may say that, `span` from the example is tied to the `userTie`.

For the more detailed explanation when those attributes are scanned, their observation and changes propagation see [Lifecycle](./lifecycle.md) documentation.

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
