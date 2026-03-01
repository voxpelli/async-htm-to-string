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

Takes the output from `html` and returns an async iterator that yields the strings as they are rendered.

### `renderToString(renderableElement)`

Same as `render()`, but asyncly returns a single string with the fully rendered result, rather than an async iterator. Automatically uses a synchronous fast path for pure-HTML templates (no async components or Promise children), avoiding async generator overhead entirely.

### `renderToStringSync(renderableElement)`

Synchronous version of `renderToString()` that returns a `string` directly instead of a `Promise<string>`. Throws a `TypeError` if the input is a Promise, or an `Error` if an async component is encountered during rendering.

Best suited for templates known to be fully synchronous:

```javascript
const { html, renderToStringSync } = require('async-htm-to-string');

// Returns string directly, no await needed
const result = renderToStringSync(html`<div class="fast">Hello</div>`);
```

## Performance

Templates built entirely from string tags and static content (no async components or Promise children) are automatically detected and rendered via a synchronous fast path. This avoids creating async generators and Promises, providing significant speedups for sync-heavy workloads.

The optimization works at multiple levels:

* **Element creation:** `h()` marks elements with `async: false` when the type is a string and all children are sync primitives or other sync elements
* **Sync fast path in `renderToString()`:** Elements with `async: false` bypass async generators entirely, using direct string concatenation
* **Hybrid optimization:** Even in async renders, sync subtrees returned by function components are rendered via the fast path
* **`isPromise` guards:** Async generators skip `await` on values that are already resolved

### Benchmark results

Measured with [mitata](https://github.com/evanwashere/mitata) on Node.js 22 (Apple M1), with `--expose-gc` and `.gc('inner')` for consistent GC behavior. "Legacy" is the pre-optimization async generator path. See [`benchmark.mjs`](./benchmark.mjs) for the full source.

| Template | Legacy | `renderToString` | `renderToStringSync` |
|---|---|---|---|
| Simple (`<div>Hello</div>`) | 91 µs | **625 ns** (146x faster) | **500 ns** (183x faster) |
| Medium (nested HTML, props, lists) | 399 µs | **3.7 µs** (109x faster) | **3.4 µs** (118x faster) |
| rawHtml child | 19 µs | **938 ns** (20x faster) | **790 ns** (24x faster) |
| Sync function component | 1.73 µs | 1.67 µs (1.04x) | **974 ns** (1.8x faster) |
| Async function component | 1.66 µs | 1.92 µs | n/a |

Key takeaways:

* **Pure HTML templates are 100-180x faster** than the legacy async generator path. The previous approach created ~9 async generators and 20-30 Promises for even a trivial `<div>Hello</div>` — all resolved synchronously but each requiring a microtask tick.
* **`renderToString()` benefits automatically** — no code changes needed. It detects sync trees and takes the fast path.
* **`renderToStringSync()` adds ~20% more** on top by avoiding even the outer `async` wrapper and its single microtask.
* **Sync function components** benefit from `renderToStringSync` (1.8x) but not from the auto fast path in `renderToString`, since function components prevent top-level `async: false` detection. The hybrid optimization does kick in for sync subtrees *within* async renders.
* **No regression for async content** — templates with async components or Promise children use the same async generator path as before.

### Why these numbers are so large

The dramatic speedups are consistent with findings across the Node.js ecosystem:

* **Async generator overhead is well-documented.** Each `yield` in an `async function*` allocates a Promise and schedules a microtask. V8's [async function internals](https://v8.dev/blog/fast-async) show that even optimized `await` requires microtask scheduling. [Node.js issue #31979](https://github.com/nodejs/node/issues/31979) documents ~10x slowdowns for `for await...of` vs `for...of` on the same data.
* **Sync fast paths are an established pattern.** [Cloudflare's streams research](https://blog.cloudflare.com/a-better-web-streams-api/) shows up to 10x speedups from eliminating promises in sync code paths. Preact, Solid.js, and Lit SSR all offer explicit sync rendering modes for the same reason.
* **The overhead compounds.** A simple `<div>Hello</div>` previously created ~9 async generators, ~20-30 Promises, and scheduled ~20-30 microtask ticks — all to concatenate 3 strings. The sync path does this in a single function call with zero allocations.

Run the benchmark yourself with `npm run benchmark`.

## Helpers

### `generatorToString(somethingIterable)`

Asyncly loops over an iterable (like eg. an async iterable) and concatenates together the result into a single string that it resolves to. The brains behind `renderToString()`.
