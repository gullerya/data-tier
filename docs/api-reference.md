# API

Here I'll detail the API, which splits into the __functional__ (JS) part and the __declarative__ tying syntax found in HTML.

While Model-to-View data flow is pretty simple and straightforward, the opposite direction, View-to-Model, relys on some pre-conditions. I'll touch this part below as well.

Beside the actual API's signatures, there is much of importance of understaning `data-tier`'s lifecycle and its runtime capabilities/limitations. See [Lifecycle](./lifecycle.md) documentation dedicated just to that part.

> In the snippets below I'll assume, that the following statement was used to import the library: `import * as DataTier from './dist/data-tier.min.js';`

## JavaScript - model definitions and operations
Imported `DataTier` object has a `ties` property.
`ties` is a data management namespace, holding model related APIs.

### __A__. `const tiedModel = DataTier.ties.create(key[, model]);`
Creates (internally) a new tie, processes the `model`, updates the views if any (synchronously) and returns the processed `model` ready for further usage by application.

Parameters:
* __`key`__ `[string]` - unique, MUST match `/^[a-zA-Z0-9]+$/` pattern
* __`model`__ `[object/Array]` - optional, MUST NOT be null

Result:
* __`tiedModel`__ `[Observable]` - created (by cloning) from the provided model, or from an empty object if none provided
> Read about `Observable` creation, APIs and more [here](https://www.npmjs.com/package/object-observer).

Examples:
```javascript
//  provided initial model example
const band = {
    name: 'Dream Theater',
    kind: 'progressive metal',
    since: 1985
};
const bandModel = DataTier.ties.create('bandModel', band);
console.log(bandModel === band);
//  false - source model is cloned

//  default empty model - object
const userSettings = DataTier.ties.create('userSettings');

//  insist on Array model (empty one in this case)
const albums = DataTier.ties.create('albums', []);

//  creating from an already crafted Observable (rare use-cases)
const oUser = Observable.from({
    firstName: 'Uria',
    lastName: 'Guller'
});
const tiedUser = DataTier.ties.create('userModel', oUser);
console.log(tiedUser === oUser);
//  true - if an Observable provided, it's taken as it is
```

### __B__. `void DataTier.ties.remove(tieToRemove);`
Discards/unties the specified tie.

Note: untying won't have any effect on the views, the will remain at their last state. If views cleanup desired, one should explicitly reset tie's properties (to `null`, for example) or delete them.

Parameters:
* __`key`__ `[string/object/Array]` - key or an actual tie model (the one obtained from `create` API call)

If the tie was created from an `Observable` (see last example above) - it will be untied, but __not revoked__, thus will remain usable by the providing application.

On the opposite, if an `Observable` was crafted during `create` API call, if will be __revoked__, thus becoming unusable for any further use.

If no tie found by the given `tieToRemove`, nothing will happen.

Examples (continue with examples above):
```javascript
//  remove providing the tie's model
DataTier.ties.remove(bandModel);
console.log(bandModel.name);
//  Error - model was revoked

//  or by key
DataTier.ties.remove('userSettings');

DataTier.ties.remove(tiedUser);
console.log(tiedUser.firstName);
//  Uria - provided Observable won't be revoked upon removal
```

### __C__. `const tiedModel = DataTier.ties.get(key);`

Retrieves tie by key.

Parameters:
* __`key`__ `[string]` - key, the tie was created with

Result:
* __`tiedModel`__ `[Observable]` - tie's model; `undefined` if none found

Example:
```javascript
const settingsTie = DataTier.ties.get('userSettings');
```

## `HTML` - tying declaration
In order to turn a DOM element into `data-tier`'s view, or putting it in other words, to tie it to the __model__, a `data-tie` attribute declaration is used.
One may tie between a model and a view's __properties__ and/or __methods__.

### __A__. properties tying

This kind of tying perfectly suites simple properties assignment, either native ones like `textContent`, `src`, `innerHTML` etc. or customly implemented, usually via `get`/`set` syntax in custom element's `class`.

Let's start from examples of __properties__ tying:
```html
<!-- full syntax (including target property) - single parameter -->
<span data-tie="user:firstName => textContent"></span>

<!-- short syntax (tying to the default target property) -->
<span data-tie="user:firstName"></span>

<!-- mixed syntaxes - multi parameter -->
<span data-tie="user:firstName, user:editFirstName => click">
<!-- firstName property will be tied to the default textContent -->
<!-- editFirstName function will be set on the element's 'click' -->
```

It is also perfectly valid to operate the same thing via JavaScript and element's `dataset` property:
```javascript
const ve = document.querySelector('.field .first-name');
ve.dataset.tie = 'user:address.city';
```

Let's take a closer look onto the single tie parameter/s parts:
* `user` - tie's __key__
* `:address.city` - __path__ to the __source property__ within the tied model
    * path can be of any depth; path separated from tie's key by the `:` (colon)
* `=> textContent` - view's __target property__ tied to the given model
    * as of now, this part may only be of a depth of 1 (flat)
    * in a multi-param definition, any target property MAY NOT be used more than once
    * target property is separated by the `=>` (fat arrow) surrounded by zero or more spaces

> Pro note: tying method properties (like `click`, `input` or a custom ones) is about __assignment__, NOT invokation. To achieve invokation of view's method/s upon model change see __methods tying__ section below.

As we've seen in the examples above, the target property may be omitted, leaving `data-tier` to resolve the target property by default. This is done by the following steps (in the exact order):
* if the element has `defaultTieTarget` property defined and returning a non-empty string - this string will be taken as the target property name
* else `value` will be used for `INPUT`, `SELECT` and `TEXTAREA`
* else `src` will be used for `IFRAME`, `IMG` and `SOURCE`
* else `href` will be used for `A`, `ANIMATE`, `AREA`, `BASE`, `DISCARD`, `IMAGE` (`SVG` namespace), `LINK`, `PATTERN`, `use` (`SVG` namespace)
* else `textContent`

### __B__. methods tying

Sometimes there is a need to tie a model to a method/s. Usually it'll happen when dealing with ready to use components, that already have their API designed via functions. This flavor is also convenient in cases where a component relies on several/many data bits and it is more effective/convenient to just pass them all in a bunch to a single function / method of the component.

Additional benefit of method tying is the fact, that `data-tier` will supply the changes array as the last argument to the tied method call, allowing more finely grained data handling than just a state representation.

```html
<!-- one may define as many parameters... -->
<custom-view data-tie="render(user:firstName, user:lastName)"></custom-view>

<!-- ... or compact them, as much more effective in this case... -->
<custom-view data-tie="update(user)"></custom-view>
<!-- ... all accorging to the target method's signature -->
```

It is possible, of course to mix the __property__ and __method__ tying in the single statement. I've not exemplified it here for the brevity.

Let's go over a quite simple syntax:
* `update` - view's __target method__; it resembles the target property in that this method will be looked for on the view/element
* `(param[, param[, ...]])` - 1 or more __parameters__ to call the method with
    * ALL parameters are expected to be taken from tied model/s
    * any number of different `ties` may be used
    * once the model of one of the method's parameters changes - `data-tier` resolves all of the params and calls the method
    * actual method's arguments will always be supplied with one more parameter - an array of the model's affecting relevant changes, if any (see [Change](https://github.com/gullerya/object-observer/blob/master/docs/observable.md#change-instance-properties) definition for more info)

> Pro note: as of now, due to synchronous changes delivery, all but some specific `Array` mutations will be delivered as a single synchronous change. Yet the API is designed as __always__ providing an Array of changes for possible future compatibility with async changes aggregation as well as with Arrays massive mutations.

### __C__. general notes

Worthy to mention, that it is perfectly valid to tie a view to the whole tie's model (as in the example with `render(user)`). In this case `path` part is omitted, of course. Since it is not possible to re-assign tie's model as a whole, this is a __one-time__ binding. It may be good, actually, for a cases like binding some immutable model to the read-only views, data for a charting widgets, for example:
```html
<!-- longer syntax to explicitly specify target property -->
<chart-widget data-tie="chartModel => data"></chart-widget>

<!-- shorter syntax if the element has 'defaultTieTarget' property set to 'data' -->
<chart-widget data-tie="chartModel"></chart-widget>
```

For the more detailed explanation about when those attributes are scanned, their observation and changes propagation see [Lifecycle](./lifecycle.md) documentation.