# AGENTS.md

> Instructions for AI coding agents working on this project.

This is a Node.js library that renders [htm](https://github.com/developit/htm) tagged templates asynchronously into strings for server-side rendering. It follows the [voxpelli Node.js module style](https://github.com/voxpelli/node-module-template/blob/main/.github/copilot-instructions.md).

## Dev environment

- Node.js `^20.11.0 || >=22.0.0` required
- Run `npm install` to set up dependencies
- CI tests on Node 20, 22, 24, 25

## Code style

- Follow [neostandard](https://github.com/neostandard/neostandard): single quotes, semicolons, 2-space indent
- Use CommonJS (`require`/`module.exports`) in `.js` files
- Use ESM (`import`/`export`) in `.mjs` files
- Maintain >99% type coverage

### JSDoc type annotations

Use JSDoc for all types. Use the `@import` syntax for type imports:

```javascript
/** @import { HtmlMethodResult, RenderableElement } from './element-types.d.ts' */

/**
 * @param {HtmlMethodResult} rawItem
 * @returns {AsyncIterableIterator<string>}
 */
const render = async function * (rawItem) {
  // implementation
};
```

## Linemod build system

This project uses CJS as source and generates ESM via [linemod](https://github.com/nicolo-ribaudo/linemod). Special comments control the transformation:

```javascript
'use strict'; // linemod-remove
// linemod-add: import { foo } from './foo.mjs';
const { foo } = require('./foo.js'); // linemod-replace-with: import { foo } from './foo.js';
const bar = () => {}; // linemod-prefix-with: export
module.exports = { bar }; // linemod-remove
```

When editing `lib/*.js` files, maintain these linemod comments to keep ESM generation working.

## Public API

The library exports these functions (from `index.js`):

| Export | Description |
|--------|-------------|
| `html` | Tagged template literal bound to htm - creates renderable elements |
| `rawHtml` | For pre-escaped HTML content (no entity encoding) |
| `h(type, props, ...children)` | Element factory function (htm is bound to this) |
| `render(element)` | Returns async iterator yielding HTML strings |
| `renderToString(element)` | Returns Promise resolving to complete HTML string |
| `generatorToString(iterable)` | Utility to concatenate async iterable to string |

## Testing

- `npm test` - Full checks (lint + types + tests + tsd)
- `npm run test:mocha` - Just tests with coverage
- `npm run check:1:lint` - Linting only
- `npm run check:1:tsc` - Type checking only

### Test style

Tests use Mocha + Chai with `should` style assertions:

```javascript
/// <reference types="mocha" />
/// <reference types="chai" />
'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const { html, renderToString } = require('..');

describe('feature', () => {
  it('should render correctly', async () => {
    await renderToString(html`<div>test</div>`)
      .should.eventually.equal('<div>test</div>');
  });
});
```

### Type tests

Type definitions are tested with `tsd` in `index.test-d.ts`:

```typescript
import { expectType, expectError } from 'tsd';
import { html, render, HtmlMethodResult } from '.';

expectType<HtmlMethodResult>(html`<div />`);
expectError(render(false));
```

## Building

- `npm run build` - Clean and generate type declarations + ESM
- `npm run build-for-test` - Build ESM version only
- `npm run clean` - Remove generated files

## File structure

```
index.js / index.mjs      # Entry points (CJS source / ESM generated)
index.d.ts / index.d.mts  # Type definitions (hand-written, commit these)
lib/render.js             # Core render logic (CJS with linemod comments)
lib/render-utils.mjs      # Render utilities (pure ESM)
lib/htm.js                # htm binding and html/rawHtml functions
lib/utils.js              # Utility functions
lib/react-utils.js        # React-borrowed validation (tags, attributes)
lib/*-types.d.ts          # Complex type definitions (hand-written)
test/*.spec.js            # Test files
```

## Key implementation details

### Async generators

The core rendering uses async generators for streaming:

```javascript
for await (const chunk of render(element)) {
  // Process each HTML chunk as it's generated
}
```

### HTML entity escaping

Uses `stringify-entities` for escaping. Content is escaped by default; use `rawHtml` to bypass:

```javascript
html`<div>${'<script>'}</div>`     // Escaped: &lt;script&gt;
html`<div>${rawHtml`<br>`}</div>`  // Not escaped: <br>
```

### Self-closing tags

React-borrowed list of void elements in `lib/react-utils.js`: `area`, `base`, `br`, `col`, `embed`, `hr`, `img`, `input`, `keygen`, `link`, `meta`, `param`, `source`, `track`, `wbr`

## What to commit

- Source `.js` files
- Hand-written type files: `index.d.ts`, `index.d.mts`, `lib/*-types.d.ts`
- Do NOT commit: generated `.d.ts` in `lib/`, generated `.mjs` files

## Dependencies

Avoid adding dependencies. Current ones are intentional:

- `htm` - Core templating
- `stringify-entities` - HTML entity encoding
- `buffered-async-iterable` - Concurrent async array processing
- `@voxpelli/typed-utils` - Type utilities (`isType`, `assertTypeIsNever`, etc.)

## Anti-patterns

- Don't remove or break linemod comments in `.js` files
- Don't skip JSDoc `@import` for type imports
- Don't use `any` types without good reason
- Don't skip tests for new functionality
- Don't forget to handle async values (Promises, async iterables)
- Don't commit auto-generated files

## PR guidelines

- Use conventional commit messages
- Husky pre-push hooks run checks automatically
- All checks must pass: `npm test`
- Keep commits focused and atomic
