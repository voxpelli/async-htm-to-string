# async-htm-to-string

Renders a [`htm`](https://www.npmjs.com/package/htm) tagged template asyncly into a string.

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat)](https://github.com/standard/semistandard)

## Usage

### Simple

```bash
yarn add async-htm-to-string
```

```javascript
const { html, render } = require('async-htm-to-string');

const content = 'wow';
const result = render(html`<div>${content}</div>`);
```

## API

### `html`

Is `h()` bound to [`htm`](https://www.npmjs.com/package/htm) (`htm.bind(h)`). Used with template literals, like:

```javascript
const renderableElement = html`<div>${content}</div>`;
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
