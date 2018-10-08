# 1. Basic example

In essence, the purpose of the `data-tier` service is to tie model and view and sync between them automatically once changes detected in either one or another.

In order to make this happen, two things need to be done:
- any model to be shown should be registered in the `data-tier` service vie `Tie` management objects
- DOM elements intended to visualize the model need to be attributed with an appropriate configuration/s

The above two may happen in any order, in any phase in the application lifecycle. `data-tier` supports lazy binding, watching for DOM changes as well as for a data changes and will pick up any new linking information relevant and tie the things up.

Let's review the actual example, where we have some `user` object which is our model and we want to bind it to some interactive view of it:

##### JS

```javascript
let user = {
	name: 'User Name',
	age: 7,
	active: true,
	address: {
		street: 'Some street',
		apartment: 15
	}
};

DataTier.ties.create('userInfo', user);
```

##### HTML

```html
<div>
	<span data-tie-text="userInfo.name"></span>
	<span data-tie-text="userInfo.age"></span>
	<input type="checkbox" data-tie-value="userInfo.active">
	<div>
		<input type="text" data-tie-value="userInfo.address.street">
		<input type="text" data-tie-value="userInfo.address.apartment">
	</div>
</div>
<script src="data-tier.js"></script>
```
 
 
# 2. Users list, localization

You may easily play with this content: create empty HTML page, copy-paste the into it the HTML section below and copy-paste the JS section into some `script` tag anywhere in that page.

This is a simple application, having:
- global selector to change localization settings of the page
- user selector from a given users list
- simple user editor
Users content and localization part are not related to each other, it's just two independent use-cases exemplified here.

##### HTML

In the HTML part below there are various `data-tie-...` attributes which are the declarative part of the tying process between the view and the model.

```html
<script src="data-tier.js"></script>
<div id="title-bar">
    <select id="language-selector">
        <template data-tie-list="userLanguages => language">
            <option data-tie-text="language.label" data-tie-value="language.id"></option>
        </template>
    </select>
</div>
<div id="user-editor" style="display:flex">
    <select id="user-selector" size="3">
        <template data-tie-list="users => user">
            <option data-tie-text="user.id" data-tie-value="user.id"></option>
        </template>
    </select>
    <div id="user-editor">
        <div>
            <label data-tie-text="l18n.user.editor.idLabel"></label>
            <span data-tie-text="currentUser.id"></span>
        </div>
        <div>
            <label data-tie-text="l18n.user.editor.nameLabel"></label>
            <input data-tie-value="currentUser.name" data-tie-placeholder="l18n.user.editor.nameHint" />
        </div>
        <div>
            <label data-tie-text="l18n.user.editor.dateLabel"></label>
            <input data-tie-value="currentUser.date" data-tie-placeholder="l18n.user.editor.dateHint" />
        </div>
    </div>
</div>
```

##### JS

In the following section we are creating basic data sets of localization data and users.

For the simplicity the content created statically in-place, in the real application one would fetch the data from the backend.
Some of the data, localization strings for instance, would probably be fetched in a lazy way on demand, since for big applications that could be not a small piece.

Most important part here is the __ties__ definitions and their manipulations within an event handlers, which effectively update the UI layer.
See, for example, how in a single line of code one can translate the whole site, assuming that the binding was properly done, of course.

```javascript
let strings = {
    en: {
        user: {
            editor: {
                idLabel: 'ID',
                nameLabel: 'Your name',
                nameHint: 'Put your name here',
                dateLabel: 'Your birthday',
                dateHint: 'dd/MM/yyyy'
            }
        }
    },
    ru: {
        user: {
            editor: {
                idLabel: 'ID',
                nameLabel: 'Ваше имя',
                nameHint: 'введите ваше имя',
                dateLabel: 'Ваш день рождения',
                dateHint: 'dd-MM-yyyy'
            }
        }
    }
};
let languages = [
    { id: 'en', label: 'English' },
    { id: 'ru', label: 'Русский' }
];
let users = [
    { id: 100, name: 'First', date: '12 Dec 1980' },
    { id: 101, name: 'Second', date: '' },
    { id: 102, name: '', date: '' }
];
let l18nTie = DataTier.ties.create('l18n', strings.en);
let currentUserTie = DataTier.ties.create('currentUser');

DataTier.ties.create('userLanguages', languages);
DataTier.ties.create('users', users);

document.getElementById('language-selector').addEventListener('change', function() {
    l18nTie.data = strings[this.value];
});

document.getElementById('user-selector').addEventListener('change', function() {
    currentUserTie.data = users.find(user => user.id === parseInt(this.value));
});
```

Although in the example above HTML part precedes the __ties__ definitions, it can be reversed completely and the library will cope with that.
You may add an elements in the even later phases of application lifecycle, or add tying attributes to the existing elements as well, and the new configuration will be picked up, tied and immediatelly reflected in UI if the __ties__ are already filled with data.