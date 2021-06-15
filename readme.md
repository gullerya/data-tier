[![NPM](https://img.shields.io/npm/v/data-tier.svg?label=npm%20data-tier)](https://www.npmjs.com/package/data-tier)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./license.md)

[![Quality pipeline](https://github.com/gullerya/data-tier/workflows/Quality%20pipeline/badge.svg?branch=main)](https://github.com/gullerya/data-tier/actions?query=workflow%3A%22Quality+pipeline%22)
[![Codecov](https://img.shields.io/codecov/c/github/gullerya/data-tier/main.svg)](https://codecov.io/gh/gullerya/data-tier/branch/main)
[![Codacy](https://img.shields.io/codacy/grade/eb34053e002648519fd3a2d78c45677b.svg?logo=codacy)](https://app.codacy.com/app/gullerya/data-tier)

# `data-tier`

`data-tier` ('tier' from 'to tie') is a two way binding (MVVM) library targeting client (browser) HTML/JavaScript applications.

Primary reasons for `data-tier` (or - why bother):
- simplicity, it is much simpler than any other MVVM libs I'm aware of
- performant and robust data handling due to [`object-observer`](https://github.com/gullerya/object-observer)
- perfectly suited for web-components based applications

It is highly advised to briefly review the library's [Lifecycle](docs/lifecycle.md) documentation for a main concepts.

> Once ready, [`data-tier`'s approach to client app architecture](docs/client-app-architecture.md) will provide a full author's take on when and how to employ data binding in a modern client applications in a non-intrusive, non-prisoning, managable and extensible way.

`data-tier` relies on an [`Observable`](https://github.com/gullerya/object-observer/blob/main/docs/observable.md)-driven event cycle, having an embedded [object-observer](https://github.com/gullerya/object-observer) as the default `Observable` provider.

`data-tier` implements a [data binding declaration API](docs/api-tying-declaration.md) (part of this library), which specifies tying data source to element's:
- attribute
- event (in progress)
- method
- property

![CHROME](docs/icons/chrome.png)<sub>61+</sub> | ![FIREFOX](docs/icons/firefox.png)<sub>60+</sub> | ![EDGE](docs/icons/edge-chromium.png)<sub>79+</sub>

Changelog is found [here](docs/changelog.md).

## Installation

Use regular `npm install data-tier --save-prod` to use the library from your local environment:
```js
import * as DataTier from 'node_modules/data-tier/dist/data-tier.min.js';
```

Alternatively, a __CDN__ deployment available (AWS driven), so one can import it as following:
```js
import * as DataTier from 'https://libs.gullerya.com/data-tier/x.y.z/data-tier.min.js';
```

> Note: replace the `x.y.z` by the desired version, one of the listed in the [changelog](docs/changelog.md).

CDN features:
- security:
  - __HTTPS__ only
- performance
  - highly __available__ (with many geo spread edges)
  - agressive __caching__ setup

## Documentation

[Starting walkthrough](docs/walkthrough.md)

[Deep dive - API](docs/api-reference.md)

[Use cases - WebComponents, ShadowDOM, MicroFrontends](docs/web-components.md)

## Security

Security policy is described [here](https://github.com/gullerya/data-tier/blob/main/docs/security.md). If/when any concern raised, please follow the process.

## Examples

The easiest point to start from is the [walkthrough](docs/walkthrough.md) examples.

Additionally, there are few the `CodePen` snippets:
- [DataTier binding with regular DOM elements](https://codepen.io/gullerya/pen/abdmebe) - simple `input` element, its `change` event and `span` reflecting the changed value
- [WebComponent scoped binding](https://codepen.io/gullerya/pen/xxZEvbK) - this time we have `input` tied to the reflecting `span` by an `input` event (immediate changes), while all of those scoped within a `web-component`, each instance of which has its own encapsulated model
- ... more to come :)

Here we'll overview a rather simple, but quite self explanatory case.

2 elements below are both views tied to the same model.
`span` is one-way bound to reflect the data.
`input` employs two-way binding.

```html
<input data-tie="tieKeyA:status => value => input">
<br>
<span data-tie="tieKeyA:status"></span>
```

This is our model initialization to make it all play together:

```js
import { ties } from 'https://libs.gullerya.com/data-tier/3.1.6/data-tier.js';

const model = ties.create('tieKeyA', {
	status: 'better than ever'
});
```

For more details see [__API reference__](docs/api-reference.md).

## Extensions

I believe, that `data-tier` as a framework should serve a single purpose of tying the model with the view in its very basic form: propagating the changes/values to the relevant recipient/s (more conceptual details and examples [here](docs/client-app-architecture.md)).

Functionalities like `repeater`, `router` and other well known UI paradigms should be provided by a __dedicated components__, probably, yet not necessary, built on top of `data-tier` or any other framework.

Me myself investing some effort in building `data-tier` oriented components. I'll maintain the list below, updating it from time to time (please update me if you have something to add here).
* [`data-tier-list`](https://www.npmjs.com/package/data-tier-list) - repeater-like component to render a list of a similar items based on a single template
* [`i18n`](https://www.npmjs.com/package/@gullerya/i18n) - internationalization library, mostly concerned with translation, where dynamic replacement of the localized texts upon active locale change is driven by `data-tier`
