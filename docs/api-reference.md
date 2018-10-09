# API

> This page describes `data-tier`'s APIs as they are in the library's ES6 module distribution.
Old APIs are effectively deprecated from 0.6.19.

### Initialization
```javascript
import * as DataTier from 'dist/module/data-tier.min.js';
```
`DataTier` variable here becomes a top level library's namespace.
Any JS related functionality will be available through the properties of this object.

### `ties` namespace
Ties (more about `Tie` [below](#tie)) management namespace having the following APIs:
##### `create(name, [model])`
Creates a new tie with the specified (unique) name.
Updates any elements already found in DOM and tied to it (by name, see HTML syntax [below](#html)).
Sets up model's observer, which will immediately reflect any changes in the tied views.

* `name` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`, unique
* `model` - optional parameter, which, if provided, MUST be an object
* result is a `Tie` object or Error if any of the above requirements is not fulfilled

```javascript
let user = { firstName: 'Ploni', lastName: 'Almoni', age: 99 },
    userTie = DataTier.ties.create('user', user),
    settingsTie = DataTier.ties.create('settings');
```
##### `remove(name)`
Removes tie by name.

Tie's model becomes unobserved by the `data-tier` and is revoked if an `Observable` was initially created by `data-tier`.
If `Observable` was provided by hosting application, it remains intact.

If no tie found by the given `name`, nothing will happen.

* `name` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`

```javascript
DataTier.ties.remove('settings');
```

##### `get(name)`
Retrieves tie by name.

If no tie found by the given `name`, will return `undefined`.

* `name` - MUST parameter, string matching the pattern `/^[a-zA-Z0-9]+$/`

```javascript
let settingsTie = DataTier.ties.get('settings');
```

#### `Tie`
