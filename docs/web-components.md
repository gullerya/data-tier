# Philisophy

`data-tier` serves perfectly the idea of `WebComponents`, well, at least as I perceive it: __creation of widely reusable, self-contained, independently developed and even possibly independently deployed components__. Those components' contract is narrowed to the DOM elements' (native, native-customized or autonomous) __properties__ and __methods__. That's all. There should be no awareness of the underlying libraries or frameworks, internal implementation details should be absolutely invisible to the compoment's consumers.

To me, this is very close to the idea of microservices in the backend world. It is almost the same (or exactly the same) as the microfrontends definition.

`data-tier` focused on a very specifically defined responsibility: __assign__ values from __model__ to __view__ and way back, where appropriate.
Therefore, it may serve as the __outer__ layer for the linkage, well, tying :) those components, easily transferring data without the need to know how compoments handling it internally.

`data-tier` MAY live inside the components as an internal layer, for the complex ones.
It MAY also be ouside to perform the high level data synchronization accross the whole application.
It MAY be the same instance of the `data-tier` for both, or, more important, each component MAY actually bring its own `data-tier` - there will no interference between them.
More than that, `data-tier` MAY live with any other framework, be it internally to some specific web component or accross them.

## Shadow DOM handling

Having said all that, let me outline the contract of work with regard to `ShadowDOM` hosts.
It is quite straight forward, except one special case, which is IMHO quite a corner one and usually won't be relevant to the most.

- __`open`__ shadow DOM will be __auto-tied__ upon adding a host element into the living DOM (in itself or as a part of a bigger DOM tree) and also __auto-untied__ in the same manner
- __`closed`__ shadow DOM will __NOT__ be automatically processed, obviously, but there are 2 API to do that explicitly:
  - __`DataTier.addRootDocument(<shadowRoot>)`__ will add the shadow root to the `data-tier` playground, thus enabling all the features of tying to it
  - __`DataTier.removeRootDocument(<shadowRoot>)`__ will untie the shadow root, so that `data-tier` will not handle it anymore
- when shadow DOM attached to an element already found in the living DOM, it should also be treated explicitly by an above mentioned APIs, since there is no any formal event about this action (see [this SO thread](https://stackoverflow.com/questions/43217178/detect-attachshadow-event) for more info)

> as a remark I'll add, that `contentDocument` of an `iframe` element MAY be handled by the same APIs as above; it won't be auto-tied / untied as of now