# Upstream htm Issues and PRs Evaluation

This document evaluates open issues and pull requests from the upstream [developit/htm](https://github.com/developit/htm) repository against our `@voxpelli/htm-improved` implementation.

**Evaluated:** January 2026  
**Upstream Issues:** ~20 substantive (excluding spam)  
**Upstream PRs:** 8 open

---

## Executive Summary

| Category | Count | Applicable to htm-improved |
|----------|-------|---------------------------|
| **Bugs** | 3 | 1 confirmed (JS comments #214) |
| **Feature Requests** | 6 | 0 (by design or not applicable) |
| **Documentation** | 4 | Not applicable (different docs) |
| **Babel Plugin** | 3 | Not applicable (we don't use it) |
| **Spam/Invalid** | ~30 | Not applicable |

**Key Finding:** Most issues relate to features we don't need (Babel plugin, Preact/React integrations) or are by-design limitations. One confirmed bug (JS comments in tags) affects us but has a simple workaround.

---

## Open Pull Requests

### PR #267: Add noNullProps option
**Status:** Not Applicable  
**Reason:** This is for `babel-plugin-htm`, which we don't use

The PR adds an option to the Babel plugin to emit `{}` instead of `null` when no props exist. This addresses TypeScript type checking concerns when using the Babel plugin.

**Our Status:** We intentionally preserve `null` for props to match React/Preact conventions. Our typing handles this correctly:
```typescript
type HFunction<Result = unknown> = (
  type: unknown,
  props: Record<string, unknown> | null,  // null is explicit
  ...children: unknown[]
) => Result;
```

---

### PR #263: Add preact and react as optional peer dependencies
**Status:** Not Applicable  
**Reason:** We don't include Preact/React integrations

---

### PR #256: Export hooks from preact integration
**Status:** Not Applicable  
**Reason:** We removed all framework integrations

---

### PR #254: Add editor integration section in docs
**Status:** Not Applicable  
**Reason:** Documentation change for upstream repo

---

### PR #249: Include Fragment in preact standalone module
**Status:** Not Applicable  
**Reason:** We removed all framework integrations

---

### PR #214: Ignore JS-style comments during parse
**Status:** ⚠️ Confirmed Bug - Affects htm-improved  
**Issue:** #213

**Problem:** JS-style comments (`//` and `/* */`) inside templates break parsing:

```javascript
html`<span
    // This comment breaks prop parsing
    id="foo"
  />`
// Result: { props: null } instead of { props: { id: "foo" } }
```

**Verified in htm-improved:**
```javascript
// Test shows props are lost after comment
const withComment = html`<span
  // comment
  id="after"
/>`;
// Result: { tag: "span", props: null, children: [] }
// Expected: { tag: "span", props: { id: "after" }, children: [] }
```

**Analysis:**
- This is a **real bug** that affects our implementation
- The PR adds ~54 lines to the parser
- Would increase bundle size marginally
- JSX supports this syntax

**Our Decision:** 
- **Documented as known limitation** - This is an edge case that:
  1. Can be avoided by not putting comments inside tag definitions
  2. Comments work fine in text content and between elements
  3. async-htm-to-string is for SSR where this is rarely needed
  
**Workaround:** Don't use JS comments inside opening tags. Use them between elements:
```javascript
// This is fine
html`
  <div>
    ${/* This comment works */null}
    <span id="foo" />
  </div>
`
```

**Future:** If demand exists, we could port PR #214's fix.

---

### PR #188: Add failing test for syntax error
**Status:** Informational Only  
**Issue:** Documents unclear error message for syntax errors

**Problem:** When a syntax error occurs, the error message is unclear:
```
TypeError: unknown: `(intermediate value)(intermediate value).push` is not a function
```

**Analysis:** This PR only adds a failing test, doesn't fix the issue. Our de-minified code provides slightly better stack traces, but error messages remain cryptic for parse errors.

**Our Status:** Not a priority - errors in templates should be caught during development, and our SSR use case means we don't optimize for error messages.

---

### PR #187: Fix duplicate data in cached build
**Status:** ⚠️ Needs Investigation  
**Issue:** #186

**Problem:** Reported issue about duplicate data appearing in cached builds, potentially causing memory growth.

**Analysis:** After reviewing the issue discussion, a collaborator (@jviide) clarified this is intentional:
- `current[0]` stores a pointer to parent state (part of the parsing stack)
- It doesn't actually duplicate memory
- The "fix" in the PR might actually increase memory usage

**Our Status:** We reviewed our implementation and it works the same way. No action needed - the original behavior is correct.

---

## Open Issues (Substantive)

### Issue #122: Unclosed void elements cause wrong virtual DOM
**Status:** By Design (JSX compatibility)  
**Labels:** question, discussion

**Problem:** HTML void elements like `<meta>`, `<link>`, `<input>` without explicit closing cause incorrect parsing.

```javascript
html`<head>
  <meta charset="utf-8">  <!-- not self-closed -->
  <title>Page</title>
</head>`
// Results in incorrect nesting
```

**Our Position:** This is **by design** for JSX compatibility. htm requires JSX-style self-closing:
```javascript
html`<head>
  <meta charset="utf-8" />
  <title>Page</title>
</head>`
```

**Note:** async-htm-to-string *does* handle void elements correctly in the render phase (using `omittedCloseTags`), but the htm parser itself requires explicit closing.

---

### Issue #76: Ampersand escapes not decoded
**Status:** By Design (No HTML entity decoding)  
**Labels:** help wanted, discussion

**Problem:** HTML entities like `&lt;`, `&gt;`, `&amp;` are not decoded:

```javascript
html`<div>&lt;</div>`
// Result: children = ["&lt;"] not ["<"]
```

**Analysis:**
- JSX handles this via build-time transformation
- Runtime decoding requires either DOM APIs or lookup tables
- Adding entity decoding would significantly increase bundle size
- The workaround is to use interpolation: `${'<'}`

**Our Position:** **Not implementing**. For SSR:
1. Entity decoding isn't commonly needed
2. Users can use `rawHtml` for pre-escaped content
3. Users can use interpolation for special characters
4. Adding decoding would add significant complexity

---

### Issue #56: Confusing error message for unclosed elements
**Status:** By Design (Size constraints)  
**Labels:** enhancement, question, proposal, debugging

**Problem:** Error messages are cryptic when elements aren't properly closed.

**Our Position:** Our de-minified codebase provides better stack traces, but we haven't added explicit error messages. This could be a future enhancement, but is low priority for SSR use cases where templates are typically well-tested.

---

### Issue #90: Optimize adjacent static parts
**Status:** Not Applicable  
**Reason:** Babel plugin optimization

---

### Issue #78: Online JSX-to-htm converter tool
**Status:** Not Applicable  
**Reason:** Tooling request, not library feature

---

### Issue #61: Document syntax for custom elements
**Status:** Not Applicable  
**Reason:** Documentation for upstream repo

---

### Issue #52: Server-side rendering documentation
**Status:** Partially Addressed  
**Reason:** We ARE an SSR library!

**Irony:** The issue asks for SSR documentation for htm. Our entire library (async-htm-to-string) is the answer to this request.

---

### Issue #28: Demo/documentation improvements
**Status:** Not Applicable  
**Reason:** Documentation for upstream repo

---

## Issues We've Already Addressed

### Security: ReDoS Vulnerability
**Status:** ✅ Fixed in htm-improved

The original htm had a regex vulnerable to ReDoS:
```javascript
// Original - vulnerable
str.replace(/^\s*\n\s*|\s*\n\s*$/g, '')
```

We replaced this with an O(n) iterative function. This fix isn't in any upstream issue because it wasn't reported there.

---

### Types: `any` everywhere
**Status:** ✅ Fixed in htm-improved

Original htm types used `any` extensively. We've replaced with `unknown` throughout and added comprehensive tsd tests.

---

### Caching: Memory Leak Potential
**Status:** ✅ Improved in htm-improved

Changed outer cache from `Map` to `WeakMap`:
```javascript
// Original
const CACHES = new Map();

// Improved
const CACHES = new WeakMap();
```

This allows garbage collection when h functions are no longer referenced.

---

## Recommendations

### Known Limitations (By Design)

| Feature | Reason |
|---------|--------|
| HTML entity decoding (#76) | Significant size increase, workarounds exist |
| Void element auto-closing (#122) | JSX compatibility is intentional |
| Better error messages (#56) | Low priority for SSR |

### Known Limitations (Bugs)

| Feature | Status |
|---------|--------|
| JS-style comments in tags (#214) | Confirmed bug, documented workaround available |

### Consider for Future

| Feature | Notes |
|---------|-------|
| JS comment support (#214) | Could port upstream PR if demand exists |

### Already Implemented

| Feature | Status |
|---------|--------|
| ReDoS security fix | ✅ Done |
| Type safety | ✅ Done |
| Memory leak fix | ✅ Done |
| Documentation | ✅ Done |

---

## Spam Issues Note

The upstream repository has accumulated significant spam:
- #268: Empty issue titled "Sarthak"
- #266: HTML code dump
- #265: HTML code dump (business website)
- Multiple others with random content

This spam is one indicator of the project's unmaintained status.

---

## Conclusion

After reviewing all open issues and PRs:

1. **No critical bugs** affect our implementation
2. **No must-have features** are missing
3. **Most requests** are for features we don't need (Babel plugin, framework integrations)
4. **Design decisions** (no entity decoding, JSX-style closing) are reasonable
5. **We've proactively fixed** issues not even reported upstream (ReDoS, types, memory)

Our `@voxpelli/htm-improved` fork is in good shape relative to upstream. The main areas where we diverge (security, types, caching) are all improvements rather than missing features.

---

## Appendix: Full Issue/PR List

### Open PRs (8)
| # | Title | Status |
|---|-------|--------|
| 267 | Add noNullProps option | Babel plugin - N/A |
| 263 | Add preact/react peer deps | Framework integration - N/A |
| 256 | Export hooks | Framework integration - N/A |
| 254 | Editor integration docs | Documentation - N/A |
| 249 | Include Fragment in preact | Framework integration - N/A |
| 214 | Ignore JS comments | **Confirmed bug** - consider porting |
| 188 | Add failing test | Informational only |
| 187 | Fix duplicate cache data | Investigated - no action needed |

### Substantive Open Issues (~20)
| # | Title | Status |
|---|-------|--------|
| 122 | Unclosed void elements | By design |
| 76 | Ampersand escapes | By design |
| 56 | Confusing error messages | Low priority |
| 90 | Optimize static parts | Babel plugin - N/A |
| 78 | Online converter tool | Tooling - N/A |
| 61 | Custom element docs | Documentation - N/A |
| 52 | SSR documentation | We ARE the solution! |
| 28 | Demo improvements | Documentation - N/A |
