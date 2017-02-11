# Tutorial - users list, localization

This tutorial exemplifies in a most general way the basic concepts and usage of DataTier library. You may easily play with this content: create empty HTML page, copy-paste the into it the HTML section below and copy-paste the JAVASCRIPT section into some `script` tag anywhere in that page.

The example is a simple application having:
- global selector to change localization settings of the page
- user selector from a given users list
- simple user editor
Users content and localization part are not related to each other, it's just two independent use-cases exemplified here.

## HTML

In the HTML part below there are various `data-tie-...` attributes which are the declarative part of the tying process between the view and the model.

```html
<script src="../../dist/data-tier.js"></script>
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



## JAVASCRIPT

In the following section we are creating basic data sets of localization data and users.

For the simplicity the content created statically inplace, in the real application one would fetch the data from the backend.
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
let l18nTie = DataTier.ties.create('l18n', Observable.from(strings.en));
DataTier.ties.create('userLanguages', Observable.from(languages));
DataTier.ties.create('users', Observable.from(users));
let currentUserTie = DataTier.ties.create('currentUser');

document.getElementById('language-selector').addEventListener('change', function () {
    l18nTie.data = Observable.from(strings[this.value]);
});

document.getElementById('user-selector').addEventListener('change', function () {
    currentUserTie.data = Observable.from(users.find(user => user.id === parseInt(this.value)));
});
```

Although in the example above HTML part preceeded the __ties__ definitions, it can be reversed completely and the library will cope with that.
You may add an elements in the even later phases of application lifecycle, or add tying attributes to the existing elements as well, and the new configuration will be picked up, tied and immediatelly reflected in UI if the __ties__ are already filled with data.