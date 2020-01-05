# Philisophy

This doc in many points crosses the (yet to be published) [general client app architecture](./docs/client-app-architecture.md) design perspective as it is manifested in `data-tier` library. Yet, I've found it right to lay out here a few concepts as well as practical points, specificaly related to the `data-tier`'s take within a `web-components`/`custom elements` world.

`data-tier` serves perfectly the idea of `web-components`, well, at least as I perceive it: __creation of widely reusable, self-contained, independently developed and even possibly independently deployed components__.

Those components' contract is narrowed to the DOM elements' (native, native-customized or autonomous) __properties__ and __methods__. That's all. There should be no awareness of the underlying mechanics. Internal implementation details should be absolutely transparent to the compoment's consumers.

We are getting very close here to the idea of componentization and microservices in the backend's world. It is almost the same (or exactly the same) as most of the microfrontend definitions.

As such and with those concerns in mind, `data-tier` is designed to focus on 2 very specific responsibilities:
* __assign__ values from __model__ to __view__ and way back, where appropriate
* __call views'__ methods with values from __model__, when a change of any of those detected

Therefore, it serves as the __composition__ layer for the linkage, well, tying :) those components to model, transferring the data without the need to know how the tied compoments are handling it internally.

`data-tier` may 'live' inside the components as the binding layer, valid use case for the complex components with complex data life cycle.

On the other hand, `data-tier` may perform the high level data synchronization accross the different components and services on the level of the whole web application.

It may be the same instance of the `data-tier` for both, or, more important, each component may actually bring its own `data-tier` - there will be no interferences nor disruptions between them.
More than that, `data-tier` may live with and/or beside any other framework, be it used internally within some specific web component or be it a higher level data manegement tier accross the application.

## Shadow DOM handling

Having said all that, let me outline the contract of work with regard to `ShadowDOM` hosts.
It is quite straight forward, except one special case, which is IMHO quite a corner one and usually won't be relevant to the most.

- __`open`__ shadow DOM will be __auto-tied__ upon adding a host element into the living DOM (in itself or as a part of a bigger DOM tree) and also __auto-untied__ in the same manner
- __`closed`__ shadow DOM will __NOT__ be automatically processed, obviously, but there are 2 API to do that explicitly:
  - __`DataTier.addRootDocument(<shadowRoot>)`__ will add the shadow root to the `data-tier` playground, thus enabling all the features of tying to it
  - __`DataTier.removeRootDocument(<shadowRoot>)`__ will untie the shadow root, so that `data-tier` will not handle it anymore
- when shadow DOM attached to an element already found in the living DOM, it should also be treated explicitly by an above mentioned APIs, since there is no any formal event about this action (see [this SO thread](https://stackoverflow.com/questions/43217178/detect-attachshadow-event) for more info)

> Pro node: `contentDocument` of an `iframe` element MAY be handled by the same APIs as above; yet it won't be auto-tied/untied as of now.