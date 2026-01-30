# Code Quality Assessment: async-htm-to-string

This document provides a comprehensive analysis of the codebase, highlighting strengths, areas for improvement, and comparisons to best-in-class library design.

---

## Executive Summary

**Overall Assessment: Good quality library with mature practices, but several areas fall short of best-in-class standards.**

The library demonstrates solid fundamentals: clear purpose, reasonable API surface, good test coverage, and thoughtful TypeScript integration via JSDoc. However, it has consistency issues, technical debt acknowledged via TODO comments, and some design decisions that could be improved.

---

## 1. Logical Consistency

### Strengths

- **Consistent async generator pattern**: The rendering pipeline uniformly uses async generators (`async function *`) for streaming, enabling memory-efficient processing of large templates
- **Consistent error handling style**: TypeErrors with descriptive messages throughout
- **Consistent validation approach**: Input validation (tags, attributes) borrowed from React with caching for performance

### Issues

#### 1.1 Inconsistent Module System Handling

The codebase uses a mixed approach that creates unnecessary complexity:

```javascript
// lib/render.js - Uses dynamic import for ESM dependency
const { renderItem } = await import('./render-utils.mjs'); // linemod-remove
```

```javascript
// lib/htm.js - Uses standard require without linemod markers
const { isType } = require('@voxpelli/typed-utils');
```

**Problem**: `lib/htm.js` lacks linemod transformation comments while `lib/render.js` uses them. This inconsistency means `htm.js` cannot be properly converted to ESM, breaking the build pattern.

#### 1.2 Inconsistent Naming Conventions

| Pattern | Example | Issue |
|---------|---------|-------|
| Leading underscore for private | `_internalHtml`, `_checkHtmlResult` | ✓ Consistent |
| Naming for async functions | `renderItem`, `render`, `renderToString` | No indication of async nature |
| Type names | `ElementProps`, `HtmlMethodResult` | Inconsistent casing: `HtmlMethodResult` should be `HTMLMethodResult` |

#### 1.3 Return Type Inconsistency

The `render` function in `lib/render.js`:

```javascript
const render = async function * (rawItem) {
  // ...
  if (Array.isArray(item)) {
    for (const value of item) {
      yield * render(value);  // Recursive yield
    }
  }
  // ...
};
```

Returns `AsyncIterableIterator<string>`, but internally delegates to `renderItem` which handles the same types differently. The overlap between `render()` and `renderItem()` is confusing—both handle similar input but with slightly different validation logic.

---

## 2. Sensible Approaches

### Strengths

#### 2.1 Streaming Architecture

The async generator approach is excellent for server-side rendering:

```javascript
// Enables streaming responses
for await (const chunk of render(element)) {
  response.write(chunk);
}
```

This allows partial responses before the full tree is processed.

#### 2.2 React-Borrowed Validation

Borrowing proven validation logic from React is pragmatic:

```javascript
// lib/react-utils.js
const VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');
```

#### 2.3 Buffered Async Processing

Using `buffered-async-iterable` for concurrent array processing while maintaining order:

```javascript
yield * bufferedAsyncMap(iterator, renderItem, { ordered: true });
```

### Issues

#### 2.4 Error Handling Anti-Pattern

**Problematic**: Silent failure for unsupported prop types with only console.error:

```javascript
// lib/render-utils.mjs:54-57
} else {
  // eslint-disable-next-line no-console
  console.error('Unexpected prop value type:', typeof propValue);
}
```

**Best practice**: Libraries should throw errors or provide a configurable warning mechanism, not silently console.error. This makes debugging difficult in production.

#### 2.5 Missing Input Sanitization Documentation

The library escapes HTML entities (good!), but the security guarantees are undocumented:

- What specific XSS vectors are protected against?
- Is the escaping sufficient for all contexts (attributes, scripts, CSS)?
- What are the limitations?

#### 2.6 Inefficient String Concatenation

```javascript
// lib/utils.js:27-32
const generatorToString = async (generator) => {
  let result = '';
  for await (const item of generator) {
    result += item;  // String concatenation in loop
  }
  return result;
};
```

**Best practice**: Use array join for better performance with many chunks:

```javascript
const generatorToString = async (generator) => {
  const chunks = [];
  for await (const item of generator) {
    chunks.push(item);
  }
  return chunks.join('');
};
```

---

## 3. Understandable Interfaces

### Strengths

#### 3.1 Clean Public API

The exported API is minimal and intuitive:

```javascript
module.exports = {
  generatorToString,  // Utility
  h,                  // Low-level factory
  html,               // Primary template API
  rawHtml,            // Escape hatch
  render,             // Streaming output
  renderToString,     // Convenience method
};
```

#### 3.2 Good README Documentation

The README covers all major use cases with clear examples.

### Issues

#### 3.3 Type Definition Complexity

The type definitions have several TODO comments indicating known issues:

```typescript
// lib/element-types.d.ts:21
// TODO: Where is the asyncness here?!
export type HtmlMethodResult = MaybePromised<MaybeArray<MaybePromised<BasicRenderableElement<ElementProps> | string>>>;
```

This triple-wrapped type (`MaybePromised<MaybeArray<MaybePromised<...>>>`) is:
1. Difficult to understand
2. Indicative of unclear async boundaries
3. Leads to the need for `any` in multiple places

#### 3.4 Confusing `rawHtml` Dual Interface

`rawHtml` can be used as both a template tag AND a function call:

```javascript
rawHtml`<div>&amp;</div>`  // Template literal
rawHtml('<div>&amp;</div>') // Direct call
```

This overloading is confusing and the type signature reflects this:

```javascript
const rawHtml = (strings, ...values) => {
  const type = () => typeof strings === 'string' ? strings : String.raw(strings, ...values);
  // ...
};
```

#### 3.5 Unexplained `skipStringEscape` Property

The `skipStringEscape` property on `BasicRenderableElement` is only used internally by `rawHtml`, but it's exposed in the public type interface without documentation.

#### 3.6 Missing JSDoc on Key Functions

Several internal functions lack documentation:

```javascript
// lib/render-utils.mjs - No JSDoc explaining the relationship between functions
async function * maybePromisedArrayToAsyncGenerator (input) { ... }
async function * renderProps (props) { ... }
async function * renderStringItem (item) { ... }
```

---

## 4. Future-Proofed Project Structure

### Strengths

#### 4.1 Dual CJS/ESM Support

The linemod-based approach enables single-source dual publishing:

```javascript
'use strict'; // linemod-remove
const { foo } = require('./foo.js'); // linemod-replace-with: import { foo } from './foo.js';
module.exports = { bar }; // linemod-remove
```

#### 4.2 Comprehensive CI Matrix

Testing against Node 20, 22, 24, 25 ensures forward compatibility.

#### 4.3 Good Tooling Integration

- ESLint (neostandard)
- TypeScript (JSDoc-based)
- Husky (pre-push hooks)
- Conventional commits
- Type coverage enforcement (99%)

### Issues

#### 4.4 Incomplete Linemod Coverage

`lib/htm.js` is NOT set up for linemod transformation:

```javascript
// lib/htm.js - Missing linemod comments
const { isPromise } = require('node:util/types');
const htm = require('htm');
const { isType } = require('@voxpelli/typed-utils');
// No 'use strict'; // linemod-remove
// No module.exports pattern with linemod
```

This file works in ESM because it only uses CommonJS exports, but it's inconsistent with the stated build system.

#### 4.5 No Source Maps Strategy

Declaration maps are generated, but there's no strategy for JavaScript source maps for debugging.

#### 4.6 Version-Locked TypeScript

```json
"typescript": "~5.9.3"
```

Using `~` (patch-only) is overly restrictive. TypeScript minor versions are generally safe to upgrade.

#### 4.7 Deprecated/Legacy Dependencies

- `keygen` in `omittedCloseTags` is deprecated in HTML5
- No consideration for Web Components / custom elements in self-closing tag handling

---

## 5. Comparison to Best-in-Class

### 5.1 vs. Preact's renderToString

| Feature | async-htm-to-string | preact-render-to-string |
|---------|---------------------|------------------------|
| Streaming | ✓ Native async iterators | ✓ Stream support |
| Suspense | ✗ Not supported | ✓ Full support |
| Concurrent rendering | ✓ buffered-async-iterable | ✓ Custom implementation |
| Bundle size | ~15KB (with deps) | ~5KB |
| Error boundaries | ✗ | ✓ |

### 5.2 vs. React Server Components

| Feature | async-htm-to-string | React Server Components |
|---------|---------------------|------------------------|
| Async by default | ✓ | ✓ |
| Selective hydration | ✗ | ✓ |
| Client/server code splitting | ✗ | ✓ |
| Streaming | ✓ | ✓ |

### 5.3 vs. lit-html (SSR)

| Feature | async-htm-to-string | @lit-labs/ssr |
|---------|---------------------|---------------|
| Template compilation | ✗ Runtime only | ✓ Build-time optimization |
| DOM diffing | ✗ | ✓ |
| Custom elements | Basic | ✓ Full support |
| Declarative shadow DOM | ✗ | ✓ |

---

## 6. Technical Debt & TODO Items

The codebase has explicit TODO comments indicating known issues:

```typescript
// lib/element-types.d.ts:8-9
// TODO: Can the values below be set to unknown instead?
any[] |
Record<string, any> |
```

```typescript
// lib/element-types.d.ts:20
// TODO: Where is the asyncness here?!
```

```typescript
// index.test-d.ts:55-56
// TODO: Eventually make this be an error
// expectError(html`<wowzors class="wow"><${customPropsElem} />Foo</wowzors>`);
```

**These indicate incomplete type safety that should be addressed.**

---

## 7. Security Considerations

### Strengths

- HTML entity escaping via `stringify-entities`
- Attribute name/value validation
- Tag name validation

### Issues

#### 7.1 No CSP Considerations

No support for nonce attributes or CSP-aware rendering.

#### 7.2 Limited Attribute Value Validation

Only validates attribute names, not values. Dangerous patterns like:

```javascript
html`<a href="${userInput}">`  // Potential javascript: URL
```

Are not protected against.

#### 7.3 No Built-in Sanitization

No integration with DOMPurify or similar for user content.

---

## 8. Performance Considerations

### Strengths

- Validation caching (`validatedTagCache`, `validatedAttributeNameCache`)
- Streaming output
- Buffered async processing

### Issues

#### 8.1 No Template Caching

Each `html` call parses the template from scratch. Best-in-class libraries (lit-html) cache parsed templates.

#### 8.2 Dynamic Import Overhead

```javascript
const { renderItem } = await import('./render-utils.mjs'); // Called per render
```

This dynamic import happens on EVERY render call, not cached.

#### 8.3 No Benchmarks

No performance benchmarks in the test suite to prevent regressions.

---

## 9. Recommendations Summary

### High Priority

1. **Fix console.error anti-pattern** - Throw errors or provide configurable warning handler
2. **Address type safety TODOs** - Replace `any` types with proper generics
3. **Fix linemod inconsistency** - Add linemod comments to `lib/htm.js`
4. **Cache dynamic import** - Move `import('./render-utils.mjs')` outside the function

### Medium Priority

5. **Add security documentation** - Document XSS protection scope and limitations
6. **Improve string concatenation** - Use array join instead of += in loop
7. **Add benchmarks** - Prevent performance regressions
8. **Document `skipStringEscape`** - Or make it private

### Low Priority

9. **Remove deprecated `keygen`** - From omittedCloseTags
10. **Consider template caching** - For performance-critical use cases
11. **Add source maps** - For debugging

---

## 10. Conclusion

**Grade: B+**

This is a well-structured library that serves its purpose effectively. It demonstrates mature software engineering practices:

- Clear separation of concerns
- Good test coverage
- Type safety via JSDoc
- Dual module format support

However, it falls short of best-in-class due to:

- Inconsistent application of patterns (linemod, error handling)
- Acknowledged technical debt (TODO comments)
- Missing advanced features (template caching, error boundaries)
- Security gaps in documentation

The library is suitable for production use in non-critical applications, but enterprises requiring strict security audits or maximum performance should evaluate alternatives.

---

## 11. Dependency Analysis (Deep Dive)

This section provides an in-depth analysis of all runtime dependencies, their interactions with the module, and how they affect the issues identified above.

### 11.1 Dependency Overview

| Dependency | Version | Purpose | Size | Transitive Deps |
|------------|---------|---------|------|-----------------|
| `htm` | ^3.0.4 | Tagged template parsing | 260KB | 0 |
| `stringify-entities` | ^4.0.3 | HTML entity encoding | 104KB | 2 |
| `buffered-async-iterable` | ^1.0.1 | Concurrent async processing | 76KB | 0 |
| `@voxpelli/typed-utils` | ^3.0.0 | Type-safe utilities | 164KB | 0 (peer: TS) |

**Total production dependencies**: 8 packages (including transitives)
**Published package size**: 6.9 KB (tarball), 21.6 KB (unpacked)

---

### 11.2 Dependency: `htm` (Core)

**Repository**: [github.com/developit/htm](https://github.com/developit/htm)  
**Last Published**: April 2022 (3.1.1)  
**Last Repo Activity**: February 2024  
**Open Issues**: 49  
**Stars**: 8,984

#### How It's Used

```javascript
// lib/htm.js
const htm = require('htm');
const _internalHtml = htm.bind(h);
```

`htm` is the heart of the library, providing the tagged template literal parser that converts template strings into virtual DOM-like structures.

#### Analysis

**Strengths**:
- Extremely lightweight (~1KB minified core)
- Zero dependencies
- Well-tested, mature codebase by Jason Miller (Preact author)
- Browser-compatible syntax
- Good TypeScript definitions

**Concerns**:

1. **STALE MAINTENANCE** ⚠️
   - Last npm publish: April 2022 (over 3.5 years ago)
   - 49 open issues, some dating back years
   - Last commit: February 2024 (documentation only)
   
   This is a **significant risk** for a core dependency. While the library is stable, no security patches or bug fixes have been released in years.

2. **Type Definition Weakness**:
   ```typescript
   // htm's types are overly permissive
   declare const htm: {
     bind<HResult>(
       h: (type: any, props: Record<string, any>, ...children: any[]) => HResult
     ): (strings: TemplateStringsArray, ...values: any[]) => HResult | HResult[];
   };
   ```
   
   The `any` types propagate into this library's type system, contributing to the type safety issues identified in Section 3.3.

3. **Version Pinning Issue**:
   ```json
   "htm": "^3.0.4"
   ```
   
   The caret allows 3.1.1 (current latest), but 3.0.4 → 3.1.1 included breaking changes in the preact integration. The library works because it only uses the core `bind()` API.

#### Impact on Identified Issues

| Issue | Impact |
|-------|--------|
| Type safety (§3.3) | **MAGNIFIES** - htm's `any` types propagate |
| Template caching (§8.1) | **NEUTRAL** - htm doesn't cache, but could enable it |
| Security (§7) | **NEUTRAL** - htm doesn't handle escaping |

---

### 11.3 Dependency: `stringify-entities` (Security)

**Repository**: [github.com/wooorm/stringify-entities](https://github.com/wooorm/stringify-entities)  
**Last Published**: April 2024 (4.0.4)  
**Open Issues**: 0  
**Stars**: 21

#### How It's Used

```javascript
// lib/render-utils.mjs
import { stringifyEntities } from 'stringify-entities';

// Attribute escaping
yield ` ${propKey}="${stringifyEntities(propValue, { escapeOnly: true, useNamedReferences: true })}"`;

// Content escaping  
yield stringifyEntities(item, { escapeOnly: true, useNamedReferences: true });
```

#### Analysis

**Strengths**:
- Actively maintained (part of unified.js ecosystem)
- Zero open issues
- Comprehensive HTML entity encoding
- 100% type coverage
- Minimal transitive dependencies (`character-entities-html4`, `character-entities-legacy`)

**How It Works** (from source analysis):

```javascript
// Default dangerous character set
const defaultSubsetRegex = /["&'<>`]/g

// With escapeOnly: true, only encodes: " & ' < > `
// These are the primary XSS-relevant characters in HTML contexts
```

**Security Analysis**:

The library **correctly** escapes the critical HTML metacharacters:
- `<` → `&lt;` (prevents tag injection)
- `>` → `&gt;` (prevents tag injection)
- `&` → `&amp;` (prevents entity injection)
- `"` → `&quot;` (prevents attribute breakout)
- `'` → `&apos;` (prevents attribute breakout)
- `` ` `` → `&#x60;` (prevents template literal injection)

**However**, there are gaps:

1. **JavaScript URL schemes not blocked**:
   ```javascript
   html`<a href="${'javascript:alert(1)'}">`
   // Output: <a href="javascript:alert(1)">
   // This is an XSS vulnerability!
   ```

2. **Event handlers accept any string**:
   ```javascript
   html`<div onclick="${userInput}">`
   // Escapes quotes but allows: onclick="alert(1)"
   ```

3. **CSS injection possible**:
   ```javascript
   html`<div style="${'background:url(javascript:alert(1))'}">`
   ```

#### Impact on Identified Issues

| Issue | Impact |
|-------|--------|
| Security documentation (§7) | **MITIGATES** basic XSS, **DOES NOT** handle context-specific attacks |
| Security - attribute values (§7.2) | **DOES NOT MITIGATE** - dangerous URL schemes pass through |
| Performance | **NEUTRAL** - efficient regex-based approach with caching |

---

### 11.4 Dependency: `buffered-async-iterable` (Performance)

**Repository**: [github.com/voxpelli/buffered-async-iterable](https://github.com/voxpelli/buffered-async-iterable)  
**Last Published**: June 2024 (1.0.1)  
**Open Issues**: 11 (mostly renovate bot PRs)  
**Stars**: 11

#### How It's Used

```javascript
// lib/render-utils.mjs
import { bufferedAsyncMap } from 'buffered-async-iterable';

async function * renderIterable (iterator) {
  yield * bufferedAsyncMap(iterator, renderItem, { ordered: true });
}
```

#### Analysis

**Strengths**:
- Same author as this library (Pelle Wessman)
- Actively maintained
- Well-typed
- Enables concurrent processing while maintaining order
- Configurable buffer size (default: 6)

**Critical Code Path** (from source analysis):

```javascript
export function bufferedAsyncMap (input, callback, options) {
  const { bufferSize = 6, ordered = false } = options || {};
  
  // Validates inputs
  if (!input) throw new TypeError('Expected input to be provided');
  if (!isAsyncIterable(asyncIterable)) throw new TypeError('...');
  
  // Pre-fetches up to bufferSize items
  // Processes callback concurrently
  // Returns results in order (when ordered: true)
}
```

**Concerns**:

1. **Same-Author Dependency Chain**:
   Both `buffered-async-iterable` and `@voxpelli/typed-utils` are by the same author. This creates a dependency on a single maintainer's availability.

2. **Complex Error Handling**:
   The source has multiple TODO comments about error handling edge cases:
   ```javascript
   // TODO: Errors from here, how to handle? allSettled() ensures they will be caught at least
   // TODO: Handle possible error here? Or too obscure?
   ```

3. **Potential Memory Issues**:
   Buffer size of 6 is reasonable, but deeply nested async trees could accumulate buffers.

#### Impact on Identified Issues

| Issue | Impact |
|-------|--------|
| Streaming (§2.1) | **ENABLES** - core to concurrent streaming |
| Performance (§8) | **MITIGATES** - concurrent processing improves throughput |
| Error handling (§2.4) | **NEUTRAL** - doesn't fix the console.error issue |

---

### 11.5 Dependency: `@voxpelli/typed-utils` (Type Safety)

**Repository**: [github.com/voxpelli/typed-utils](https://github.com/voxpelli/typed-utils)  
**Last Published**: January 2026 (3.0.0)  
**Open Issues**: 2  
**Stars**: 3

#### How It's Used

```javascript
// lib/htm.js
const { isType } = require('@voxpelli/typed-utils');

// Used for type-safe runtime checks
if (isType(result, 'array')) { ... }
if (isType(result, 'object')) { ... }

// lib/render-utils.mjs
import { assertTypeIsNever, isType, typesafeIsArray } from '@voxpelli/typed-utils';

// Exhaustive type checking
assertTypeIsNever(item, `Invalid render item type: ${typeof item}`);
```

#### Analysis

**Strengths**:
- Actively maintained (same author)
- Zero runtime dependencies
- Provides type-narrowing utilities that improve TypeScript inference
- `assertTypeIsNever` enables exhaustive switch checks

**Functions Used**:

| Function | Purpose | Benefit |
|----------|---------|---------|
| `isType(value, type)` | Type-safe typeof check | Narrows types correctly |
| `typesafeIsArray(value)` | Array.isArray that returns `unknown[]` not `any[]` | Better type safety |
| `assertTypeIsNever(value, msg)` | Exhaustive check assertion | Catches unhandled cases |

**Concerns**:

1. **TypeScript Peer Dependency**:
   ```json
   "peerDependencies": {
     "typescript": ">=5.8.0"
   }
   ```
   
   This means users MUST have TypeScript >=5.8 installed, even at runtime, or the package won't work correctly. This is unusual and potentially problematic for:
   - Users not using TypeScript
   - Users on older TypeScript versions

2. **Same Author Risk** (repeated):
   Three of four dependencies are by the same author.

3. **Version Coupling**:
   The library requires TypeScript 5.8+, but async-htm-to-string pins TypeScript at ~5.9.3. If the utility requires newer TS features, this could break.

#### Impact on Identified Issues

| Issue | Impact |
|-------|--------|
| Type safety (§3.3) | **MITIGATES** - provides better type guards |
| `any` types (§6) | **PARTIAL MITIGATION** - helps narrow but can't fix htm's anys |
| Exhaustive checks | **ENABLES** - assertTypeIsNever catches missing cases |

---

### 11.6 Transitive Dependencies

#### `character-entities-html4` and `character-entities-legacy`

These are data-only packages providing HTML entity mappings for `stringify-entities`:

```javascript
// character-entities-html4 - Standard HTML4 entities
{ "amp": "&", "lt": "<", "gt": ">", "quot": "\"", ... }

// character-entities-legacy - Legacy named entities
{ "AElig": "Æ", "Aacute": "Á", ... }
```

**Risk**: Very low. These are static data with no code execution.

---

### 11.7 Security Vulnerabilities

```bash
$ npm audit
2 low severity vulnerabilities

diff  >=6.0.0 <8.0.3
  Severity: low - DoS vulnerability
  Via: mocha (dev dependency only)
```

**Assessment**: No production vulnerabilities. The 2 low-severity issues are in dev dependencies (mocha → diff) and don't affect published package.

---

### 11.8 Dependency Health Summary

| Dependency | Maintenance | Security | Type Safety | Risk Level |
|------------|-------------|----------|-------------|------------|
| `htm` | ⚠️ STALE | ✓ Good | ⚠️ `any` types | **MEDIUM** |
| `stringify-entities` | ✓ Active | ⚠️ Context-blind | ✓ Good | **LOW** |
| `buffered-async-iterable` | ✓ Active | ✓ Good | ✓ Good | **LOW** |
| `@voxpelli/typed-utils` | ✓ Active | ✓ Good | ✓ Good | **LOW** |

---

### 11.9 New Issues Uncovered

#### 11.9.1 Single-Maintainer Risk

Three of four dependencies (`buffered-async-iterable`, `@voxpelli/typed-utils`, and the library itself) are maintained by the same person. If the maintainer becomes unavailable:
- Security patches may not be released
- Compatibility with new Node.js versions uncertain
- No community fallback

**Recommendation**: Document succession plan or encourage community co-maintainers.

#### 11.9.2 TypeScript Peer Dependency Leakage

`@voxpelli/typed-utils` requires TypeScript as a peer dependency, but this requirement isn't documented in `async-htm-to-string`. Users may encounter cryptic errors if TypeScript isn't available.

**Recommendation**: Either:
1. Document the TypeScript requirement
2. Or vendor/fork the specific utilities needed

#### 11.9.3 htm Staleness Creates Future Risk

The `htm` library hasn't been updated in 3+ years. While stable, this means:
- No adaptation to new JavaScript features
- No security patches if vulnerabilities discovered
- No TypeScript improvements

**Recommendation**: Consider alternatives like:
- `htm/mini` (smaller build)
- Direct tagged template parsing
- Migration path documentation

#### 11.9.4 Context-Blind Escaping Insufficient

`stringify-entities` with `escapeOnly: true` only handles HTML text/attribute contexts. It does NOT protect against:

| Attack Vector | Protected? | Example |
|---------------|------------|---------|
| Tag injection | ✓ Yes | `<script>` → `&lt;script&gt;` |
| Attribute breakout | ✓ Yes | `" onclick=` → `&quot; onclick=` |
| JavaScript URLs | ✗ No | `javascript:alert(1)` passes through |
| CSS injection | ✗ No | `expression()` passes through |
| SVG/MathML | ✗ No | Different escaping rules |

**Recommendation**: Add URL scheme validation for `href`, `src`, `action` attributes.

---

### 11.10 Updated Recommendations

Based on the dependency analysis, additional recommendations:

#### High Priority (New)

1. **Add URL scheme validation** - Block `javascript:`, `data:`, `vbscript:` in URL attributes
2. **Document TypeScript requirement** - Make peer dependency explicit
3. **Monitor htm maintenance** - Create tracking issue for alternative evaluation

#### Medium Priority (New)

4. **Add succession documentation** - For single-maintainer dependencies
5. **Consider vendoring typed-utils** - Reduce external dependency risk
6. **Add context-aware escaping** - Different rules for different attribute types

#### Updated Dependency Matrix

| Action | Current State | Recommended State |
|--------|---------------|-------------------|
| `htm` version | ^3.0.4 | Pin to 3.1.1 or evaluate alternatives |
| `stringify-entities` | Current | Add wrapper for URL validation |
| `buffered-async-iterable` | Current | Monitor for v2 |
| `@voxpelli/typed-utils` | Current | Consider vendoring subset |

---

### 11.11 Dependency Conclusion

The dependency choices are generally sensible and lightweight, but reveal several hidden risks:

1. **Type safety issues are partially dependency-induced** - htm's permissive types cascade through the system
2. **Security gaps exist at the dependency boundary** - stringify-entities handles encoding but not context-aware validation
3. **Single-maintainer concentration** - Creates bus-factor risk
4. **Stale core dependency** - htm's lack of updates is a growing concern

The library would benefit from:
- Explicit documentation of security boundaries
- Consideration of htm alternatives or forks
- Wrapper functions for context-aware security
- Community co-maintenance recruitment
