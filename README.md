# async-htm-to-string

Renders a [`htm`](https://www.npmjs.com/package/htm) tagged template asyncly into a string.

[![npm version](https://img.shields.io/npm/v/async-htm-to-string.svg?style=flat)](https://www.npmjs.com/package/async-htm-to-string)
[![npm downloads](https://img.shields.io/npm/dm/async-htm-to-string.svg?style=flat)](https://www.npmjs.com/package/async-htm-to-string)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/voxpelli/async-htm-to-string)
[![Follow @voxpelli@mastodon.social](https://img.shields.io/mastodon/follow/109247025527949675?domain=https%3A%2F%2Fmastodon.social&style=social)](https://mastodon.social/@voxpelli)

## Usage

### Simple

```bash
npm install async-htm-to-string
```

```javascript
const { html, renderToString } = require('async-htm-to-string');

const customTag = ({ prefix }, children) => html`<div>${prefix}-${children}</div>`;
const dynamicContent = 'bar';
// Will equal "<div>foo-bar</div>"
const result = await renderToString(html`<${customTag} prefix="foo">${dynamicContent}</${customTag}>`);
```

### Async Support

The library has full support for async values:

* **Async Components:** Components can be `async` functions
* **Async Children:** Children can be `Promise`s or arrays of `Promise`s
* **Deeply Nested:** Resolved values are recursively processed
* **Concurrency:** Uses [`buffered-async-iterable`](https://www.npmjs.com/package/buffered-async-iterable) to process async arrays concurrently while maintaining order

```javascript
const AsyncComponent = async ({ id }) => {
  const data = await fetchData(id);
  return html`<div>${data}</div>`;
};

// <AsyncComponent /> will be awaited and rendered
const result = await renderToString(html`
  <${AsyncComponent} id="123" />
  ${Promise.resolve('Async child')}
`);
```

## API

### `html`

Is `h()` bound to [`htm`](https://www.npmjs.com/package/htm) (`htm.bind(h)`). Used with template literals, like:

```javascript
const renderableElement = html`<div>${content}</div>`;
```

### `rawHtml / rawHtml(rawString)`

If you need to provide pre-escaped raw HTML content, then you can use `rawHtml` as either a template literal or by calling it with the

```javascript
const renderableElement = rawHtml`<div>&amp;${'&quot;'}</div>`;
```

```javascript
const renderableElement = rawHtml('<div>&amp;</div>');
```

You can also use the result of any of those `rawHtml` inside `html`, like:

```javascript
const renderableElement = html`<div>${rawHtml`&amp;`}</div>`;
```

### `h(type, props, ...children)`

The inner method that's `htm` is bound to.

### `render(renderableElement)`

Takes the output from `html` and returns an async iterator that yields the strings as they are rendered

### `renderToString(renderableElement)`

Same as `render()`, but asyncly returns a single string with the fully rendered result, rather than an async iterator.

## Helpers

### `generatorToString(somethingIterable)`

Asyncly loops over an iterable (like eg. an async iterable) and concatenates together the result into a single string that it resolves to. The brains behind `renderToString()`.

## License

**SPDX: `(0BSD AND Apache-2.0)`**

This project uses a dual-license structure:

* **Main code** ([`LICENSE`](LICENSE)): [0BSD](https://spdx.org/licenses/0BSD.html) (BSD Zero Clause License) - essentially public domain
* **Vendored htm** ([`lib/vendor/htm-LICENSE`](lib/vendor/htm-LICENSE)): [Apache-2.0](https://spdx.org/licenses/Apache-2.0.html)

The [htm](https://github.com/developit/htm) library (Copyright 2018 Google Inc.) is vendored in `lib/vendor/` with modifications documented in [`lib/vendor/htm-CHANGES.md`](lib/vendor/htm-CHANGES.md). The Apache 2.0 license applies to this vendored code.

For most use cases, you can treat this package as permissively licensed. The Apache 2.0 portions require attribution if you redistribute the source code.
