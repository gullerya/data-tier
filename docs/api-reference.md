# API

`data-tier` API splits into __operational__ (JavaScript) and __declarative__ (HTML).

Beside the actual APIs, it is very important to understand `data-tier`'s lifecycle, its capabilities and limitations. See [Lifecycle](./lifecycle.md) documentation dedicated just to that.


---

## JavaScript part - model definitions and operations

`ties` is a data management namespace, holding model related APIs:
```js
import { ties } from './dist/data-tier.min.js';
```

### `ties.`**`create(key[, model])`**
Defines a new tie, processes `model`, updates views (synchronously) and returns the processed `model` ready for further usage by application.

| Parameter | Type                     | Default | Description |
|-----------|--------------------------|---------|-------------|
| `key`     | string, required, unique |         | MUST match `/^[a-zA-Z0-9]+$/` pattern; used in other APIs and HTML declarations to identify the tie |
| `model`   | object/Array, optional   | `{}`    | MUST NOT be null; processed into `Observable` (if not yet), so the provided `model` remains unchanged |

| Returns   | Description |
|-----------|-------------|
| object    | `Observable` created from the provided model; read about `Observable` creation, APIs and more [here](https://www.npmjs.com/package/object-observer)

#### Examples
```javascript
//  provided initial model example
const band = {
    name: 'Dream Theater',
    kind: 'progressive metal',
    since: 1985
};
const bandModel = ties.create('bandModel', band);
console.log(bandModel === band);
//  false - source model is cloned

//  default empty model - object
const userSettings = ties.create('userSettings');

//  insist on Array model (empty one in this case)
const albums = ties.create('albums', []);

//  creating from an already crafted Observable (rare use-cases, but perfectly valid)
const oUser = Observable.from({
    firstName: 'Uria',
    lastName: 'Guller'
});
const tiedUser = ties.create('userModel', oUser);
console.log(tiedUser === oUser);
//  true - if an Observable provided, it's taken as it is
```

### `ties.`**`update(key, model)`**
Updates tie's model, processes `model`, updates views (synchronously) and returns the processed `model` ready for further usage by application.
If the tie is not found, if will be created (see `create` above).

| Parameter | Type             | Description |
|-----------|------------------|-------------|
| `key`     | string, required | tie's key   |
| `model`   | object/Array             | MUST NOT be null; processed into `Observable` (if not yet), so the provided `model` remains unchanged |

| Returns   | Description |
|-----------|-------------|
| object    | `Observable` created from the provided model; read about `Observable` creation, APIs and more [here](https://www.npmjs.com/package/object-observer)

### `ties.`**`get(key)`**
Retrieves tie's model.

| Parameter | Type             | Description |
|-----------|------------------|-------------|
| `key`     | string, required | tie's key   |

| Returns          | Description |
|------------------|-------------|
| object/undefined | `Observable` model (see `create`/`update` APIs); `undefined` if none found |

### `ties.`**`remove(tieToRemove)`**
Discards/unties the specified tie.

Note: untying won't have any effect on the views, they will remain at their current state. If views cleanup desired, one should explicitly reset the model (to `null`, for example).

| Parameter | Type                    | Description |
|-----------|-------------------------|-------------|
| `key`     | string/object, required | key or the tie's model (the one returned from `create`/`update`/`get` APIs) |

`Observable` model produced by `create`/`update` APIs will be __revoked__, thus becoming unusable for any further use.

Yet, if the tie was created from an `Observable` provided by application, it will be untied but __not revoked__.

If no tie found, nothing will happen.

---

## HTML part - tying declaration

`data-tie` attribute serves to tie HTML element to model.

Model can be tied to an element's __properties__ and __methods__.
Additionally, tie declaration may specify, which event should be used to bind the 'view' back to model.

> As of now, `data-tier` doesn't support attributes tying.

### Formal syntax

`data-tie` attribute can have 1 or more tying declarations:
```
<tying declaration>[, <tying declaration>[, ...] ]
```
where a single declaration is:
```
tieKey[:path] [=> [target] [=> event] ]
```

`=>` sequence is used as parts separator (with 0 or more spaces around).
To specify `event` while omitting `target`, use 2 sequental separators.

| Part name | Required | Description                             |
|-----------|----------| ----------------------------------------|
| `tieKey`  | yes      | tie key (see JS APIs description above) |
| `path`    |          | dot (`.`) separated path into the model object; when provided, MUST follow `tieKey` and prefixed by colon (`:`); when not specified, the whole model used as a tied value |
| `target`  |          | element's property that the model will be assigned to or taken from; when not specified, resolved as explained below |
| `event`   |          | event to be used to update model from the view; when not specified, resoved as explained below |

#### Target property - default resolution

Target property, when omitted, resolved thus:
* `value` if element one of: `INPUT`, `SELECT`, `TEXTAREA`
* else `src` for: `IFRAME`, `IMG`, `SOURCE`
* else `href` for: `A`, `ANIMATE`, `AREA`, `BASE`, `DISCARD`, `IMAGE` (`SVG` namespace), `LINK`, `PATTERN`, `use` (`SVG` namespace)
* else `textContent`

#### Change event - default resolution

Mostly, event property will be omitted, meaning `data-tier` won't do view-to-model binding (per declaration).
The only exception here is the elements list below, for which `change` event is listened by default, if not specified otherwise: `INPUT`, `SELECT`, `TEXTAREA`.

### Properties tying

General rule here is simple - `data-tier` will perform assignment of model (resolving path, if any) to element's property upon initialization or any change of former.

#### Examples

```html
<span data-tie="userTie:firstName"></span>
```
Above reads: `firstName` property of `userTie` to be tied to the `textContent` property (default) of the `span`.

```html
<user-view data-tie="userTie => data"></user-view>
```
Above reads: the whole `userTie` is tied to `data` property of element `user-view`.

```html
<input data-tie="userTie:address.city"></input>
```
Above reads: `address.city` property of model will be tied to `value` propety (default) of `input`; additionally, `change` event (default) listener will be set up sync `input`'s value back to `address.city` model.

```html
<textarea data-tie="userTie:description => => input"></textarea>
```
Above reads: the tied property is `value`, default for `textarea` element;
the view-to-model tying event explicitly set to `input` (instead of the default `change`).

```html
<date-input data-tie="userTie:birthday => data => change"></date-input>
```
Above reads: ties `data` property of custom input component to the `birthday` property of model; `change` event is listened for the view changes to be reflected in model;

#### Remark A - `dataset`

Tying declaration may also be scripted via `dataset` property:
```javascript
inputElement.dataset.tie = 'user:address.city';
```

#### Remark B - `classList`

`classList` property deserved a special treatment.
When `classList` tied, the following happens:
* classes found on the tied view upon initialization are taken as the __baseline__ state
* each time the view's `classList` updated, the __baseline__ classes are merged with the model and the result becomes the new classes state
* `classList` model may be `string`, `object` or `Array`:
    * `string` is taken simply as a class to add
    * `Array` - each of its elements taken as a class; __all__ of'em added to the view; if some of the members are removed - those classes are removed from the view correspondingly
    * `object` - each of its __keys__ taken as a class; those with truthy values are added and the falsish ones - removed to/from the view; this way one may force removal of the __baseline__ class

### Methods

Sometimes it is more convenient to tie model via element's method.

Additional benefit of method tying is the fact, that `data-tier` will supply the changes array as the last argument to the tied method call, allowing more finely grained data handling, than just a state recalculation.

```html
<!-- multiple parameters -->
<custom-view data-tie="render(userTie:firstName, userTie:lastName)"></custom-view>

<!-- full model as a whole -->
<custom-view data-tie="update(userTie)"></custom-view>
```

It is possible, of course to mix __property__ and __method__ tying declarations in the single one.
I've not exemplified it here for the brevity.

Let's go over a quite simple syntax:
* `update` - view's __target method__; it resembles the target property in that this method will be looked for on the view/element
* `(arg1[, arg2[, ...]])` - 1 or more __arguments__ to call the method with
    * argument syntax is the same as in the property parameter case
    * __all__ arguments are expected to be taken from a tied model/s
    * any number of different `ties` may be used
    * once the model of one of the method's arguments changes - `data-tier` resolves all of the arguments and calls the method
    * actual method's arguments will always be supplied with one more thing - an array of the model's affecting relevant changes, if any (see [Change](https://github.com/gullerya/object-observer/blob/master/docs/observable.md#change-instance-properties) definition for more info)

> Pro note: as of now, due to synchronous changes delivery, all but some specific `Array` mutations will be delivered as a single synchronous change. Yet the API is designed as __always__ providing an Array of changes for possible future compatibility with async changes aggregation as well as with Arrays massive mutations.

---

For the more detailed explanation about when tie declaration attributes are scanned, their observation and changes propagation see [Lifecycle](./lifecycle.md) documentation.