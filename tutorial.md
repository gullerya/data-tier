# TUTORIAL - Users selector with editor and localization

This tutorial exemplifies in a most general way the basic concepts and usage of DataTier library. You may easily play with this content: create empty HTML page, copy-paste the into it the HTML section below and copy-paste the JAVASCRIPT section into some `script` tag anywhere in that page.

The example is a simple application having:
- global selector to change localization settings of the page
- user selector from a given users list
- simple user editor

The idea is to see the binding a set of data definitions (languages, users, selected user) and the corresponding UI elements vizualizing it.

In the HTML part below there are various `data-tie-...` attributes which are the declarative part of the tying process between the view and the model.
Variations of the `data-tie-...` attributes are, in essence, the __rules__ which prescribe how the model will be vizualized.
There is a set of (predefined rules)[rules-reference.md] which are maintained by the author of the library, but even more important is the fact that there is an API to add a custom __rules__ 'on the fly' (even in the later phase of application lifecycle).

__Rule__ notation `data-tie-text="currentUser.address.street"` says: bind the content of the `currentUser` tie (see below) in the path `address.street` to this element using a logic of `tieText` rule. This specific rule simple pastes the content into the `textContent` property of the element.

## HTML
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