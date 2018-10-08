# Change log

Medieval
--------

* __0.6.20__
  * initial provisioning of ES6 module
  * new API defined and implemented in ES6 module distribution

Ancient
-------

* __0.6.19__
  - Fixed incorrect behavior when `tie-property` configured on the element **after** it was added to the DOM

* __0.6.18__
  - Fixed [issue no. 12](https://github.com/gullerya/data-tier/issues/12)

* __0.6.17__
  - Added `tie-property` OOTB controller - having parameter syntax `path.to.data => propName` it is made possible to tie to arbitrary element property (yes, this is having `CustomElements` in mind)

* __0.6.16__
  - Fixed potential issue with empty (`null`) object traversal in deep tying

* __0.6.15__
  - Fixed [issue no. 11](https://github.com/gullerya/data-tier/issues/11)

* __0.6.14__
  - Fixed defect in `tie-list` controller when text nodes present in the `template` element
  - Added `tie-datetime-text` OOTB controller

* __0.6.13__
  - Added `tie-input` OOTB controller in other to track an immediate changes in input elements supporting `input` event (types: `text`, `password` of `input` element, `textarea` element).

* __0.6.12__
  - Fixed [issue no. 10](https://github.com/gullerya/data-tier/issues/10)
  - Further performance improvements

* __0.6.11__
  - Fixed [issue no. 8](https://github.com/gullerya/data-tier/issues/8)
  - Fixed [issue no. 9](https://github.com/gullerya/data-tier/issues/9)
  - Minor performance improvements

* __0.6.10__
  - Added a possibility to create/update Tie's data with a plain JS object, in this case `data-tier` will attempt to auto-create and use `Observable` from it, using an embedded `Observable` implementation   
  - Fixed [issue no. 7](https://github.com/gullerya/data-tier/issues/7)

* __0.6.9__
  - Conceptually `Rule` has been replaced by `Controller`. There are still no API changes with regard to that, nor any API are yet published, but there will be some refactoring in this area in future releases
  - Fixed [issue no. 6](https://github.com/gullerya/data-tier/issues/6), some performance improvements made for a large scale DOM manipulations

* __0.6.8__
  - Fixes: issue no. 2 (smooth handling of an empty values given to the controllers definition), issue no. 4 (non working repeaters on subgraph list), issue no. 5 (improvements of `data-tie-classes`)

* __0.6.7__
  - Added a possibility to create a tie without providing any initial data, for early setup with lazy data provisioning

* __0.6.5__
  - Fixed a case that element having no dataset breaks the views collection flow (this is not a valid case, but see this [issue](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10790130/#) in Edge, so got to be defensive here)
  -	Added `tieSrc` rule and removed obsolete `tieImage` rule (did the same as `tieSrc`, just in a less general flavor)
  - Added `tieHRef` rule
  - Added `tieClasses` rule

* __0.6.0__
  - Moved to `object-observer.js` library as an observation engine, were impacted both the API and the implementation.

Primordial
----------

* __0.5.41__
  - First version, based on native `Object.observe` technology.
