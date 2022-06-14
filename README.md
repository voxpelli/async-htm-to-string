# async-htm-to-string

Renders a [`htm`](https://www.npmjs.com/package/htm) tagged template asyncly into a string.

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/voxpelli/eslint-config)
[![ES Module Ready Badge](https://img.shields.io/badge/es%20module%20ready-yes-success.svg)](https://esmodules.dev/)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)

## Usage

### Simple

```bash
npm install async-htm-to-string
```

```javascript
const { html, renderToString } = require('async-htm-to-string');

const customTag = ({ prefix }, children) => html`<div>${prefix}-${children}</div>`;
const dynamicContent = 'bar';
// Will equal "<div>foo-bar</div>
const result = await renderToString(html`<${customTag} prefix="foo">${dynamicContent}</${customTag}>`);
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
