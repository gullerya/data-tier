# API - tying declaration

This document specifies the syntax of binding a __data source__ to a __DOM element__:
- data source - is any primitive, object, or part of an object graph
- DOM element - any native or custom element, where tie target of it might be:
  - property
  - attribute
  - method
  - event

Tying declaration self is expressed as an attribute set on the element.

---

## Formal syntax

`attr-name="<tying declarations>"`

`<tying declarations>`
- `<tying declaration>[, <tying declaration>[, ...] ]`

`<tying declaration>`
- `tieKey[:path] [=> [property] [=> V2M event] ]` - property tying
- `tieKey[:path] a> attribute [=> V2M event]` - attribute tying
- `tieKey[:path] m> method` - method tying
- `tieKey[:path] e> event` - event tying

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