# async-htm-to-string

## Running tests effectively

- **Quick feedback:** `npm run test:node` — dot reporter + coverage summary. Use while iterating.
- **Single file:** `npx c8 node --test --test-reporter dot test/escaping.spec.js`
- **Full validation:** `npm test` — all checks (tsc, eslint, knip, type-coverage) then tests. Use before committing.
- **Checks only:** `npm run check` — skip tests when you only changed types or config.
- **Type tests:** `npx tstyche --reporters dot,summary` — run tstyche type tests only.

### Output verbosity

Default scripts use compact output (dot reporter, `--skip-full` coverage, no type-coverage detail) to keep context window usage low.

When you need more detail to diagnose a failure:

```sh
# Full TAP output (see which specific test failed and why)
npx c8 node --test --test-reporter spec 'test/**/*.spec.js'

# Per-file coverage table (find which files lack coverage)
npx c8 report --reporter=text

# Type-coverage with every uncovered identifier listed
npx type-coverage --detail --strict --at-least 99 --ignore-files 'test/*'
```

## Code style

- **Types in JS** — JSDoc annotations in `.js` files, not TypeScript source
- ESM-only (`"type": "module"`)
- 2-space indentation, neostandard linting (`@voxpelli/eslint-config`)
- Arrow functions preferred (`func-style` rule)
- Watch for: `n/no-sync` (flags Sync methods), `unicorn/no-array-callback-reference`

## Type system (JSDoc)

- `@type` casts on arrow callbacks don't fix type-coverage — extract to named functions
- `index.d.ts` is hand-maintained — update when adding/removing public exports
- 99% type-coverage threshold with `--strict`

## Architecture

- `lib/htm.js` — `h()` element creator, `html` tagged template, `rawHtml`
- `lib/render.js` — `render`, `renderSync`, `renderToString`, `renderToStringSync`
- `lib/render-utils.js` — async generators + sync render functions + `AsyncFallbackError`
- `lib/escape-html.js` — inline HTML escaper (6 chars: `& < > " ' \``)
- `lib/react-utils.js` — tag/attribute validation, omitted close tags (derived from React)
- **Sync fast path**: Elements with `async: false` bypass async generators. `renderToString` tries sync first, catches `AsyncFallbackError`, falls back to async.
- `benchmark.js` — Performance benchmarks (mitata)

## Security model

This library is an HTML **renderer**, not a **sanitizer**. Understanding the trust model prevents misguided changes.

### What it protects against
- **Interpolated values are escaped**: Text content and attribute values pass through `escapeHtml()` (6 chars: `& < > " ' \``). Both async and sync paths call the same `escapeHtml` function at identical positions.
- **Structural injection blocked**: `isTagValid` and `isAttributeNameValid` prevent injection via tag/attribute names (no spaces, `<`, `>`, `"` allowed).
- **Prototype pollution safe**: `Object.hasOwn()` used for `omittedCloseTags` lookup — immune to `__proto__`/`constructor` as tag names.

### What it intentionally allows
- **Any tag or attribute name**: `script`, `iframe`, `onclick` etc. are valid — the library renders what you ask for.
- **`rawHtml` bypasses escaping**: This is the documented escape hatch. `skipStringEscape: true` only takes effect when `type` is a function (not a string tag).
- **Control characters and lone surrogates pass through**: Matches `stringify-entities { escapeOnly: true }` behavior. Documented in `test/escaping.spec.js`.
- **Number values are unescaped**: JS numbers (including `NaN`, `Infinity`) cannot produce HTML-dangerous characters.

### Code notes
- `escapeHtml` relies on `ESCAPE_RE` and `ESCAPE_MAP` being perfectly synchronized. A desync throws `TypeError` at runtime.
- `skipStringEscape` is `@internal` in JSDoc but visible in `BasicRenderableElement` type exports. TypeScript's `@internal` is advisory only.
- `AsyncFallbackError` catch blocks correctly re-throw non-`AsyncFallbackError` exceptions in both `renderToString` and `renderElement`.

## Runtime utilities (@voxpelli/typed-utils v4)

This project uses `@voxpelli/typed-utils` for type-safe runtime checks:
- `assertTypeIsNever(value, msg)` — exhaustiveness guard (returns `never`, throws at runtime). Use with `explainVariable` for error messages: `assertTypeIsNever(x, \`Unexpected: ${explainVariable(x)}\`)`
- `explainVariable(value)` — like `typeof` but returns `'null'`/`'array'` instead of `'object'` for those cases. Use in error messages.
- `isType(value, type)` — type-narrowing guard (replaces `typeof`)
- `typesafeIsArray(value)` — `Array.isArray()` typed as `unknown[]` (not `any[]`)

### assertTypeIsNever and jsdoc/require-returns-check
Since `assertTypeIsNever` returns `never`, eslint-plugin-jsdoc's `require-returns-check` rule thinks functions ending with it lack a return expression. Fix by using `@type` function cast instead of `@param`/`@returns` JSDoc on those functions.

## Type testing (tstyche)

Type tests live in `typetests/index.test.ts`. Key practices (per [tstyche maintainer review](https://github.com/voxpelli/async-htm-to-string/pull/120#discussion_r2816504639)):

- **Type under test on the left:** Use `expect<MyType>().type.toBeAssignableFrom(value)` (not `expect(value).type.toBeAssignableTo<MyType>()`). Keeps the focus on what the type accepts.
- **No loops for rejection tests:** Each invalid type gets its own assertion. Loops create union types that mask false positives — adding a valid member to the array won't break the test. ([Details](https://github.com/voxpelli/async-htm-to-string/pull/120#discussion_r2816536405))
- **`toRaiseError()` for error testing:** Use directly without `@ts-expect-error` — tstyche handles the error detection internally.
- **`--target` for thorough testing:** `test:tstyche` uses `--target` from `engines.typescript` for thorough multi-version checks. `check:2` skips `--target` for faster feedback.

## Commits

Conventional format: `feat:`, `fix:`, `chore:`, `perf:`, `test:`, `docs:`, `refactor:`
