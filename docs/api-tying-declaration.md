# API - tying declaration

This document specifies the syntax of binding a __DOM element__ to a __data source/s__ in the HTML context:
- data source - is any primitive, object, or part of an object graph
- DOM element - any native or custom element, where tie target of it might be:
  - attribute
  - event
  - method
  - property

Tying declaration self is expressed as an attribute value, set on the element.

---

Terminology:
- 'V2M' is used to refer to view-to-model flow/setting/event etc, according to the context
- terms 'tie' / 'bind' are used interchangeably and bear equal semantic

## Formal syntax



`attr-name="<tying declarations>"`

`<tying declarations>`
- `<tying declaration>[, <tying declaration>[, ...] ]`

`<tying declaration>`
- `tieKey[:path] [=> [property] [=> V2M event] ]` - property tying
- `tieKey[:path] a> attribute [=> V2M event]` - attribute tying
- `tieKey[:path] e> event` - event tying
- `method(tieKey[:path] [, tieKey[:path] [, ...]])` - method tying

### Syntactical parts definition

`attr-name`
- attribute name, that the specific data centric library works with (`data-tie` in case of `data-tier`)
- compliant with an attribute names HTML spec

`tieKey`
- key reference to the tie holding the data source model
- compliant with the following regex: `^[a-zA-Z0-9]+$`
- __not__ equal to one of the reserved keys:
  - `scope`

`path`
- dot (`.`) separated path into the model object
- arrays indices referenced by dot notation as well (eg `array.0.property`)
- if the `path` is not specified, the whole model used as a tied value

`attribute`
- element's __attribute__, that the tied data will be __assigned__ to; in case of V2M setup, this attribute will be used as a source for model update
- `attribute` tying MUST use a special directive part: `a>`
- the data expected to be assigned thus: `<element>.setAttribute(attribute, String(<data>))` (see more in __Data transfer__ section below)

`event`
- framework will add an event listener, taken from model, listening to the specified `event` (eg framework may do `<element>.addEventListener(event, <data>)`)
- `event` tying MUST use a special directive part: `e>`
- if an old value of the model is available, it will be removed from event listener
- the tied data MUST be a function, in any other case, it should have no effect (the old listener still MUST be removed)

`method`
- invoke element's method with the specified tied arguments, taken from model/s
- method should be invoked upon each change of one or more tied arguments

`property`
- element's __property__, that the tied data will be __assigned__ to; in case of V2M setup, this property will be used as a source for model update
- `property` part is optional (see more in __Data transfer__ section below)
- the data expected to be assigned thus: `<element>.property = <data>` (see more in __Data transfer__ section below)

`V2M event`
- V2M event part is for a view-to-model flow, serving th 2-way binding scenario
- thus, when V2M event is not specified, tie declaration MAY be considered as 1-way binding (with some exceptions)
- V2M event should internally be used by data binding library as a trigger for model update, originating in the element's change
- data binding framework __MAY imply__ V2M event part definition in case of some elements, like implying `change` for `input` etc

### Data transfer

When the data (model) is being assigned to the element (view), there are few points that need to be addressed:
- data serialization MAY be required in some cases of property tying
- data serialization (stringification) MUST be applied in all cases of attribute tying
- convenience feature: default property resolution rules
- convenience feature: default V2M event resolution rules

#### Default property resolution rules

> In case the default property resolution is undesired, implementation MAY turn the property part as required and skip the default resolution concern.

Suggested resolution waterfall:
- if the `property` specified, use the specified one
- else use __`value`__ for: `INPUT`, `SELECT`, `TEXTAREA`
- else use __`src`__ for: `IFRAME`, `IMG`, `SOURCE`
- else use __`href`__ for: `A`, `ANIMATE`, `AREA`, `BASE`, `DISCARD`, `IMAGE` (`SVG` namespace), `LINK`, `PATTERN`, `use` (`SVG` namespace)
- else use __`textContent`__

#### Default V2M event resolution rules

In vast majority of cases omitting V2M event part will set a 1-way binding relation, leaving 2-way binding opted out by default.

For some elements, from convenience perspective only, a default V2M event resolution MAY be applied, thus making the 2-way binding opted in by default.

Suggested resolution waterfall:
- if V2M event specified, use the specified one
- else use `change` event for: `INPUT`, `SELECT`, `TEXTAREA`
- else do nothing (1-way binding path)

#### Serialization rules

Attributes assignment rules are driven by HTML spec - attribute value MAY ONLY be of a type `string` and as such will always be stringified.

Properties assignment is a more complex case. In many cases, especially having in mind the rise of a (possibly) complex web components, the original data type assignment desired.

Suggested property assignment serialization waterfall:
- stringify data for:
  - `value` property for: `INPUT`, `SELECT`, `TEXTAREA`
  - `src` property for: `IFRAME`, `IMG`, `SOURCE`
  - `href` property for: `A`, `ANIMATE`, `AREA`, `BASE`, `DISCARD`, `IMAGE` (`SVG` namespace), `LINK`, `PATTERN`, `use` (`SVG` namespace)
  - `textContent` property for the rest
  - stringify should produce an empty string (`''`) if the data is `null` or `undefined`
- else assign data unchanged
