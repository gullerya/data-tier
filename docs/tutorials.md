# Intro

To allow some quick impression of what we are talking about here, as well as ready-to-use playground to hack around. Once JSFiddle will allow to import ES6 modules nicely, I'll push those there too.

On this page I'll describe shortly each example and link to it's own `md` where broader explanation will be found. In the same folder there are `htm` and `js` files, open the `htm` as a usual web page and you have a small workin app.

## 1. User view

User view is a small app (below 30 lines of `js` and below 50 lines of `html`) with 2 main view blocks:
* form with input elements for a user's personal info, address and activation checkbox
* condensed summary preview of the user's info

Both of those views are tied to the same model.
App is simulating the fetching of the data from the server and initiating the model via `data-tier` APIs.
Actual MVVM part is around 5 lines of code!

Due to the living binding, editing of input fields immedatelly updates the model and then immediatelly reflected in the summary preview.
> Pay attention, that by default `data-tier` listens on the `change` event of an `input` elements to track value changes. Therefore model update happens only when the field's value committed - on moving the focus away.

Additional feature exemplified here is managing a view state via classes tied to model.
This part involves few lines of code (within those 5 yet) where one part of the model is observed and upon changes another part is being updated.
It is cool, take a look on it!

[Link](./tutorials/a-user-view/user-view.md)

More examples to do...