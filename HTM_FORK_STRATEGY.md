# HTM Fork Strategy: Implementation Report

This document describes the implementation of the `@voxpelli/htm-improved` workspace package, the rationale behind key decisions, and guidance for future maintenance.

**Last Updated:** January 2026 (post-implementation)

---

## Executive Summary

**Status: ✅ Implemented as workspace package**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Approach** | Workspace package (not vendoring) | Enables future git subtree split |
| **License** | Apache-2.0 (separate from main 0BSD) | Clean license separation |
| **Types** | Full JSDoc + tsd tests | Type safety with CJS compatibility |
| **Security** | ReDoS fix implemented | O(n) iterative whitespace trimming |

---

## 1. Implementation Overview

### 1.1 Final Structure

```
/workspace/
├── packages/
│   └── htm-improved/
│       ├── lib/
│       │   └── htm.js          # Core code (de-minified, typed)
│       ├── index.js            # CJS entry point
│       ├── index.d.ts          # TypeScript declarations
│       ├── index.test-d.ts     # tsd type tests
│       ├── package.json        # Apache-2.0 licensed
│       ├── LICENSE             # Apache 2.0 (from htm)
│       ├── CHANGES.md          # All modifications
│       └── README.md           # Package documentation
├── lib/
│   └── htm.js                  # Imports from @voxpelli/htm-improved
├── package.json                # workspaces: ["packages/*"]
└── ...
```

### 1.2 Integration

```javascript
// lib/htm.js - Updated import
const htm = require('@voxpelli/htm-improved');
const _internalHtml = htm.bind(h);
```

```json
// package.json
{
  "workspaces": ["packages/*"],
  "dependencies": {
    "@voxpelli/htm-improved": "workspace:*"
  }
}
```

---

## 2. Why Workspace Package (Not Vendoring)

### 2.1 Original Consideration

| Factor | Vendoring | Workspace Package |
|--------|-----------|-------------------|
| Initial effort | 1-2 hours | 4-8 hours |
| Future flexibility | Low | High |
| License clarity | Inline comments | Separate package |
| Type exports | Complex | Standard npm |
| Community reuse | Not possible | Via git subtree |

### 2.2 Decision: Workspace Package

The workspace approach was chosen because:

1. **Future Extraction**: Can split to standalone repo with `git subtree`
2. **Clean License**: Apache-2.0 clearly isolated from main 0BSD
3. **Standard Types**: CJS `export = htm` with namespace works normally
4. **Publishable**: Could publish to npm if community interest emerges
5. **Test Isolation**: Package can have its own test configuration

### 2.3 Git Subtree Future

If the package becomes useful to others:

```bash
# Split the subdirectory into a separate branch
git subtree split -P packages/htm-improved -b htm-improved-split

# Push to a new repository
cd /path/to/new/htm-improved-repo
git init
git pull /path/to/async-htm-to-string htm-improved-split
git remote add origin git@github.com:voxpelli/htm-improved.git
git push -u origin main
```

---

## 3. Technical Decisions

### 3.1 null vs undefined for Props

**Decision**: Keep `null` for "no props" argument

```javascript
// htm passes null when no props exist
h('div', null, 'child')
```

**Rationale**:
- Matches React's `createElement(type, null, ...children)`
- Matches Preact's `h(type, null, ...children)`
- Original htm behavior
- Ecosystem compatibility

**Linting**: Added ESLint override for `unicorn/no-null`:

```javascript
// eslint.config.mjs
{
  files: ['packages/htm-improved/**/*.js', 'test/vendor-htm.spec.js'],
  rules: {
    'unicorn/no-null': 'off',
  },
}
```

### 3.2 ReDoS Security Fix

**Original vulnerable code**:

```javascript
str.replace(/^\s*\n\s*|\s*\n\s*$/g, '')
```

This regex has polynomial backtracking on strings like `" ".repeat(1000) + "\n"`.

**Fixed implementation**:

```javascript
const trimNewlineWhitespace = (str) => {
  // Pass 1: Find start position (trim leading whitespace if it contains \n)
  let start = 0;
  let hasLeadingNewline = false;

  while (start < str.length) {
    const char = str[start];
    if (char === '\n') {
      hasLeadingNewline = true;
      start++;
    } else if (char === ' ' || char === '\t' || char === '\r') {
      start++;
    } else {
      break;
    }
  }

  if (!hasLeadingNewline) start = 0;

  // Pass 2: Find end position (similar logic)
  // ...

  return str.slice(start, end);
};
```

**Complexity**: O(n) linear time, immune to backtracking attacks.

### 3.3 WeakMap for Outer Cache

**Original**:

```javascript
const CACHES = new Map();  // h function → template cache
```

**Improved**:

```javascript
const CACHES = new WeakMap();  // h function → template cache
```

**Benefit**: When an h function is no longer referenced, its cache can be garbage collected. The original Map would hold references forever.

### 3.4 Type System Design

**Challenge**: CJS module with exported types

**Solution**: Namespace merged with const

```typescript
declare const htm: Htm;

// eslint-disable-next-line @typescript-eslint/no-redeclare
declare namespace htm {
  export type { HFunction, BoundHtm, BuiltTemplate, Htm };
}

export = htm;
```

**Usage**:

```typescript
import htm = require('@voxpelli/htm-improved');

type HFunction = htm.HFunction;
const html = htm.bind(myH);
```

---

## 4. Changes from Original htm

### 4.1 Summary Table

| Category | Change | Impact |
|----------|--------|--------|
| **Security** | ReDoS fix in whitespace trimming | Critical |
| **Performance** | WeakMap for outer cache | Minor improvement |
| **Code Style** | De-minified, neostandard formatting | Maintainability |
| **Types** | JSDoc throughout, `unknown` instead of `any` | Type safety |
| **Documentation** | Comprehensive comments | Maintainability |
| **Tests** | 62 tests (43 + 12 ported, 7 new) | Reliability |
| **Removed** | Mini variant, Preact/React integrations | Simplification |

### 4.2 What Was NOT Changed

- **API**: 100% compatible with htm v3.1.1
- **Parsing Algorithm**: Same state machine logic
- **Output Format**: Identical element structure
- **props = null Convention**: Preserved for ecosystem compatibility

### 4.3 Full Documentation

See `packages/htm-improved/CHANGES.md` for comprehensive details including:
- Line-by-line source mapping
- Algorithm explanation
- Type comparison tables
- Security analysis

---

## 5. License Compliance

### 5.1 Apache 2.0 Requirements Met

| Requirement | Implementation |
|-------------|----------------|
| Include license | `packages/htm-improved/LICENSE` |
| State changes | `packages/htm-improved/CHANGES.md` |
| Preserve copyright | Headers in all files |
| Modification notices | CHANGES.md fulfills Section 4(b) |

### 5.2 License Headers

```javascript
/**
 * Improved fork of htm with JSDoc types, security fixes, and better caching.
 *
 * Based on htm v3.1.1 - Hyperscript Tagged Markup (https://github.com/developit/htm)
 * Original work Copyright 2018 Google Inc.
 * Modifications Copyright 2026 Pelle Wessman
 * Licensed under the Apache License, Version 2.0 - See ./LICENSE for full text
 * See ./CHANGES.md for detailed list of modifications from original.
 *
 * @module @voxpelli/htm-improved
 */
```

### 5.3 Type Definition Attribution

```typescript
/**
 * Type definitions for @voxpelli/htm-improved
 *
 * Based on the original htm type definitions.
 * Original work Copyright 2018 Google Inc.
 * Modifications Copyright 2026 Pelle Wessman
 *
 * Licensed under the Apache License, Version 2.0
 */
```

---

## 6. Test Coverage

### 6.1 Ported Tests

From `htm/test/index.test.mjs` (43 tests):
- Basic parsing
- Props handling
- Spread props
- Closing tags
- Children
- Special characters
- HTML comments

From `htm/test/statics-caching.test.mjs` (12 tests):
- Template caching
- `this` binding behavior
- Staticness bits

### 6.2 New Tests (7 tests)

```javascript
describe('vendored htm security', () => {
  describe('trimNewlineWhitespace (ReDoS fix)', () => {
    it('should handle pathological whitespace inputs efficiently');
    it('should trim whitespace containing newlines correctly');
    it('should preserve whitespace without newlines');
  });
});

describe('vendored htm type compatibility', () => {
  describe('h function receives correct types', () => {
    it('should pass null for props when no props exist');
    it('should pass object for props when props exist');
    it('should pass string tag names correctly');
    it('should pass function tag names correctly');
  });
});
```

### 6.3 Type Tests (tsd)

`packages/htm-improved/index.test-d.ts` covers:
- `htm.bind()` basic usage
- `BoundHtm` return types
- `HFunction` variations
- Template literal interpolation
- Component and dynamic tags
- Fragments and text content
- Nested elements
- Boolean and spread attributes

---

## 7. Configuration Updates

### 7.1 Root package.json

```json
{
  "license": "0BSD",
  "workspaces": ["packages/*"],
  "dependencies": {
    "@voxpelli/htm-improved": "workspace:*"
  }
}
```

### 7.2 ESLint Configuration

```javascript
// eslint.config.mjs
{
  files: ['packages/htm-improved/**/*.js', 'test/vendor-htm.spec.js'],
  rules: {
    'unicorn/no-null': 'off',
  },
}
```

### 7.3 Knip Configuration

```json
{
  "workspaces": {
    ".": {
      "ignore": ["index.test-d.ts"]
    },
    "packages/htm-improved": {
      "ignore": ["index.test-d.ts"]
    }
  }
}
```

### 7.4 .gitignore

```gitignore
# Generated types
*.d.ts
!/packages/**/index.d.ts  # Allow workspace type definitions
```

---

## 8. Maintenance Guidelines

### 8.1 When to Update

- **Security issues**: Immediately address any vulnerabilities
- **Node.js compatibility**: Test with new Node versions
- **TypeScript updates**: Update types if needed for new TS features
- **Bug fixes**: Apply fixes for any discovered issues

### 8.2 How to Update

1. Make changes in `packages/htm-improved/lib/htm.js`
2. Update `CHANGES.md` with modification details
3. Update version in `packages/htm-improved/package.json` if publishing
4. Run tests: `npm test`
5. Update type tests if API changes

### 8.3 Upstream Monitoring

While htm is unlikely to be updated, occasionally check:
- https://github.com/developit/htm/issues
- https://github.com/developit/htm/pulls

If significant upstream changes occur, evaluate whether to incorporate them.

---

## 9. Conclusion

The `@voxpelli/htm-improved` workspace package successfully:

1. ✅ **Eliminates stale dependency risk** - Full control over codebase
2. ✅ **Fixes security vulnerability** - ReDoS replaced with O(n) function
3. ✅ **Improves type safety** - JSDoc + tsd tests, `unknown` over `any`
4. ✅ **Maintains compatibility** - 100% API compatible with htm v3.1.1
5. ✅ **Documents everything** - Comprehensive CHANGES.md and comments
6. ✅ **Enables future flexibility** - Can split to standalone repo if needed

The workspace approach provides the benefits of both vendoring (full control) and standalone packages (clean separation, future publishability) while maintaining a single repository for easier development.
