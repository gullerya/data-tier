# TUTORIAL - Users selector with editor and localization


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

```javascript
let strings = {
    en: {
        user: {
            editor: {
                nameLabel: 'Your name:',
                nameHint: 'Put your name here',
                dateLabel: 'Your birthday:',
                dateHint: 'dd/MM/yyyy'
            }
        }
    },
    ru: {
        user: {
            editor: {
                nameLabel: 'Ваше имя:',
                nameHint: 'введите ваше имя',
                dateLabel: 'Ваш день рождения:',
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