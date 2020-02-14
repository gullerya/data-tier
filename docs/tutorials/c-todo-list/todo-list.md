# User view example

In essence, the purpose of the `data-tier` service is to tie model and view and sync between them automatically once changes detected in either one or another.

In order to make this happen, two things need to be done:
- any model to be shown should be registered in the `data-tier` service via `Tie` management objects
- DOM elements intended to visualize the model need to be attributed with an appropriate configuration/s

The above two may happen in any order, at any phase in the application lifecycle. `data-tier` supports lazy binding, watching for DOM changes as well as for a data changes and will pick up any new linking information relevant and tie the things up.

We are simulating fetching user data and defining the model. Below is an abbreviated version of that:

##### JS

```javascript
import * as DataTier from '../node_modules/dist/data-tier.min.js';

let user = {
	firstName: 'Aya',
	lastName: 'Guller',
	age: 4,
	active: true,
	address: {
		country: 'Dreamland',
		city: 'Hope',
		street: 'Thousand Smiles',
		block: 6,
		apartment: 11
	}
};

const model = DataTier.ties.create('userInfo', userData);
model.classes = { active: true };
model.observe(() => {
    model.classes.inactive = !model.active;
}, { path: 'active' });
```

In order to exemplify somewhat more complex data management, in this case to manipulate view's state via tied `classList`, I've thrown a bit of observation and manual data manipulation logic as a bonus :).

##### HTML

```html
<form class="user-form">
	<div class="block personal">
        <input type="text" data-tie="userInfo:firstName">
        ...
	</div>
	<div class="block address">
        <input type="text" data-tie="userInfo:address.country">
        ...
	</div>
	<div class="block status">
		<input type="checkbox" data-tie="userInfo:active">
	</div>
</form>

<user-view class="user-view" data-tie="userInfo:classes => classList">
	<div>
        <span data-tie="userInfo:firstName"></span>
        ...
	</div>
	<div>
        <span data-tie="userInfo:address.block"></span>
        ...
	</div>
</user-view>
```
 
 I've abbreviated the `HTML` part for clarity, the full example is [here](tutorials/a-user-view/user-view.htm).
 The main idea here is to show the tying of the model to the interactive `form` from one side, and to a kind of condensened view of the data on the other.
 
 Changing the form values are reflected in the model and then immediatelly propagated to the view.
 Pay attention, that `input` elements update the model in `change` event, only when the new values is committed.
 You're welcome to play with the `checkbox` to follow the management of the element's state via classes.