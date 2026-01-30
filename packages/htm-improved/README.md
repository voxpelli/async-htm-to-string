# @voxpelli/htm-improved

An improved fork of [htm](https://github.com/developit/htm) with JSDoc types, security fixes, and better caching.

[![npm version](https://img.shields.io/npm/v/@voxpelli/htm-improved.svg?style=flat)](https://www.npmjs.com/package/@voxpelli/htm-improved)
[![Apache 2.0 License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Why This Fork?

The original [htm](https://www.npmjs.com/package/htm) package hasn't been updated since April 2022. This fork provides:

- **Security Fix**: Replaced a regex vulnerable to ReDoS (polynomial backtracking) with an O(n) iterative function
- **JSDoc Types**: Full JSDoc type annotations for better IDE support and type checking
- **WeakMap Caching**: Uses WeakMap for the outer cache to prevent memory leaks
- **Code Quality**: De-minified, documented, and formatted according to [neostandard](https://github.com/neostandard/neostandard)

## Installation

```bash
npm install @voxpelli/htm-improved
```

## Usage

```javascript
const htm = require('@voxpelli/htm-improved');

// Create an h function
const h = (type, props, ...children) => ({ type, props, children });

// Bind htm to your h function
const html = htm.bind(h);

// Use it!
const element = html`<div class="foo">Hello, ${'World'}!</div>`;
// => { type: 'div', props: { class: 'foo' }, children: ['Hello, ', 'World', '!'] }
```

### With Preact

```javascript
import htm from '@voxpelli/htm-improved';
import { h } from 'preact';

const html = htm.bind(h);

function App() {
  return html`<div>Hello from Preact!</div>`;
}
```

### With React

```javascript
import htm from '@voxpelli/htm-improved';
import { createElement } from 'react';

const html = htm.bind(createElement);

function App() {
  return html`<div>Hello from React!</div>`;
}
```

## API

### `htm.bind(h)`

Binds htm to a hyperscript function and returns a tagged template function.

**Parameters:**
- `h` - A hyperscript function with signature `(type, props, ...children) => element`

**Returns:** A tagged template function that parses HTM syntax

**Note:** The `props` parameter will be `null` (not `undefined`) when no props are provided, matching React/Preact conventions.

## Changes from Original htm

See [CHANGES.md](CHANGES.md) for a detailed list of modifications from the original htm v3.1.1.

Key changes:
- ReDoS vulnerability fix in whitespace trimming
- WeakMap for outer cache (better garbage collection)
- Full JSDoc type annotations
- De-minified and documented code

## License

Apache-2.0

Based on [htm](https://github.com/developit/htm) by Jason Miller (Copyright 2018 Google Inc.)
