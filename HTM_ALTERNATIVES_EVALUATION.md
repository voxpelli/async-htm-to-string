# HTM Alternatives Evaluation

This document evaluates alternatives to the `htm` dependency, including maintained forks, alternative libraries, and the feasibility of implementing our own solution.

---

## Executive Summary

**Recommendation: Create a minimal fork of htm for maintenance purposes, with potential future migration to xhtm.**

| Option | Viability | Effort | Risk | Recommendation |
|--------|-----------|--------|------|----------------|
| Keep htm as-is | ⚠️ Medium | None | Growing | Short-term only |
| Fork htm | ✓ High | Low | Low | **Recommended** |
| Switch to xhtm | ✓ High | Medium | Low | Future option |
| Switch to htl | ✗ Low | High | High | Not recommended |
| Build custom | ⚠️ Medium | High | Medium | Not recommended |

---

## 1. Current htm Analysis

### 1.1 Maintenance Status

| Metric | Value | Assessment |
|--------|-------|------------|
| Last npm publish | April 2022 | ⚠️ 3.5+ years stale |
| Last code commit | January 2020 | ⚠️ 5+ years stale |
| Last repo activity | February 2024 (docs only) | ⚠️ Minimal |
| Open issues | 49 | ⚠️ Unaddressed |
| Open PRs | 8 | ⚠️ Not merged |
| Stars | 8,984 | ✓ Popular |
| Weekly downloads | ~1.2M | ✓ Widely used |

### 1.2 Code Complexity

```
Source files: 5
Total lines: ~326
Core parsing (build.mjs): 292 lines
```

The codebase is small and well-structured:
- `index.mjs` - Entry point with caching (29 lines)
- `build.mjs` - Core parsing logic (292 lines)
- `constants.mjs` - Configuration flags (2 files, 2 lines)

### 1.3 Features Used by async-htm-to-string

Only the core `bind()` API is used:

```javascript
const htm = require('htm');
const _internalHtml = htm.bind(h);
```

The library does NOT use:
- Preact integration (`htm/preact`)
- React integration (`htm/react`)
- Mini variant (`htm/mini`)
- Babel plugin (`babel-plugin-htm`)

---

## 2. Fork Analysis

### 2.1 Existing Forks

| Fork | Stars | Last Updated | Assessment |
|------|-------|--------------|------------|
| crllect/htm | 4 | Aug 2023 | Adds noNullProps option |
| ksenginew/htm | 2 | Jun 2022 | No significant changes |
| Others (18+) | 0-1 | 2019-2024 | Abandoned/personal |

**No actively maintained community fork exists.**

### 2.2 Fork Viability

**Forking htm is highly viable because:**

1. **Small codebase**: Only ~326 lines of source
2. **Zero dependencies**: No transitive maintenance burden
3. **Stable API**: No breaking changes expected
4. **Apache 2.0 license**: Permissive, allows forking
5. **Well-tested**: Existing test suite available

**Recommended fork approach:**

```
Option A: Minimal maintenance fork
- Fork to @voxpelli/htm or similar
- Apply security patches only
- Keep API identical
- Effort: ~2-4 hours initial, minimal ongoing

Option B: Vendored subset
- Copy only needed files into lib/
- Remove unused code (preact, react, mini)
- Inline as internal module
- Effort: ~4-8 hours initial, no external dependency
```

### 2.3 Fork Maintenance Requirements

| Task | Frequency | Effort |
|------|-----------|--------|
| Security monitoring | Ongoing | Low |
| Node.js compatibility | Per Node release | Low |
| Bug fixes | As needed | Low |
| TypeScript updates | As needed | Low |

---

## 3. Alternative Libraries

### 3.1 xhtm (Extensible HTM)

**Repository**: [github.com/dy/xhtm](https://github.com/dy/xhtm)

| Metric | Value |
|--------|-------|
| Last publish | April 2023 |
| Stars | 29 |
| Size | 12KB unpacked |
| Dependencies | 0 |

**Advantages:**
- More recent maintenance (2023 vs 2022)
- Extended HTML support (optional close tags, CDATA)
- Smaller when minified
- Same author style (dy is active)

**Code comparison:**

```javascript
// htm
const htm = require('htm');
const html = htm.bind(h);

// xhtm - identical API!
import xhtm from 'xhtm';
const html = xhtm.bind(h);
```

**Compatibility:** Nearly drop-in replacement. Key differences:
- xhtm handles more HTML edge cases (optional closing tags)
- Slightly different error messages
- Same output format

**Test compatibility (estimated):** 95%+ of existing tests should pass.

### 3.2 htl (Hypertext Literal)

**Repository**: [github.com/observablehq/htl](https://github.com/observablehq/htl)

| Metric | Value |
|--------|-------|
| Last publish | September 2021 |
| Stars | 361 |
| Maintainer | Mike Bostock (D3.js) |
| Size | 60KB unpacked |

**Critical Issue: DOM-based**

```javascript
// htl uses browser DOM APIs
function renderHtml(string) {
  const template = document.createElement("template");  // ← DOM required!
  template.innerHTML = string;
  return document.importNode(template.content, true);
}
```

**NOT SUITABLE** for server-side rendering without jsdom.

### 3.3 vhtml

**Repository**: [github.com/developit/vhtml](https://github.com/developit/vhtml)

| Metric | Value |
|--------|-------|
| Last publish | December 2019 |
| Maintainer | Same as htm (Jason Miller) |

**Purpose:** Hyperscript-to-HTML-string renderer, NOT a template literal parser.

```javascript
// vhtml is NOT a tagged template - it's an h() implementation
import h from 'vhtml';
h('div', { class: 'foo' }, 'Hello');  // → "<div class="foo">Hello</div>"
```

**Could be used WITH htm**, but doesn't replace it.

### 3.4 Tagged Template Alternatives

| Library | Purpose | Suitable? |
|---------|---------|-----------|
| `lit-html` | DOM-based templating | ✗ No (browser-only) |
| `nanohtml` | DOM-based | ✗ No |
| `hyperx` | Older htm predecessor | ✗ No (unmaintained) |
| `yo-yo` | DOM-based | ✗ No |

**None are suitable replacements for server-side string rendering.**

---

## 4. Custom Implementation Analysis

### 4.1 Feasibility

Building a custom tagged template parser is **feasible but not recommended**.

**Required functionality:**
1. Parse tagged template literals
2. Extract tag names, attributes, children
3. Handle self-closing tags
4. Handle spread attributes (`...${props}`)
5. Handle dynamic tag names (`<${Component}>`)
6. Handle fragments (`<></>`)
7. Handle closing tag shorthand (`<//>`)

**Effort estimate:** 
- Initial implementation: 40-80 hours
- Testing & edge cases: 20-40 hours
- Ongoing maintenance: Significant

### 4.2 htm's Parsing Algorithm

The core algorithm is elegant but non-trivial:

```javascript
// Simplified state machine
const MODE_TEXT = 1;
const MODE_TAGNAME = 3;
const MODE_PROP_SET = 5;

for (let i = 0; i < statics.length; i++) {
  for (let j = 0; j < statics[i].length; j++) {
    char = statics[i][j];
    
    if (mode === MODE_TEXT) {
      if (char === '<') {
        commit();
        mode = MODE_TAGNAME;
      } else {
        buffer += char;
      }
    }
    // ... more state transitions
  }
}
```

**Complexity factors:**
- Quote handling (single/double)
- Whitespace normalization
- Comment stripping
- Self-closing detection
- Error recovery

### 4.3 Custom vs Fork

| Factor | Custom Implementation | Fork htm |
|--------|----------------------|----------|
| Initial effort | 60-120 hours | 2-8 hours |
| Test coverage | Must write new | Existing tests |
| Edge cases | Must discover | Already handled |
| Compatibility | May differ | Identical |
| Maintenance | Full responsibility | Minimal |

**Recommendation: Fork, don't rebuild.**

---

## 5. Migration Path Analysis

### 5.1 To xhtm

```javascript
// Before (htm)
const htm = require('htm');
const html = htm.bind(h);

// After (xhtm)
import xhtm from 'xhtm';
const html = xhtm.bind(h);
```

**Migration steps:**
1. Add xhtm to dependencies
2. Update import in `lib/htm.js`
3. Run full test suite
4. Fix any edge case differences
5. Remove htm dependency

**Estimated effort:** 4-8 hours

**Risk:** Low - APIs are compatible

### 5.2 To Forked htm

```javascript
// Before
const htm = require('htm');

// After
const htm = require('@voxpelli/htm');
// OR
const htm = require('./lib/htm-parser.js');  // vendored
```

**Migration steps:**
1. Fork repository or vendor files
2. Update package.json / imports
3. No code changes needed

**Estimated effort:** 2-4 hours

**Risk:** Very low - identical API

---

## 6. Recommendation

### 6.1 Short-term (Now)

**Create a minimal fork of htm:**

1. Fork `developit/htm` to `voxpelli/htm` (or vendor into lib/)
2. Update dependencies to point to fork
3. Apply any pending security-relevant PRs
4. Update TypeScript definitions

**Rationale:**
- Zero API changes required
- Minimal effort
- Eliminates stale dependency concern
- Maintains full compatibility

### 6.2 Medium-term (6-12 months)

**Evaluate migration to xhtm:**

1. Add xhtm as optional/experimental
2. Run compatibility tests
3. Document any behavioral differences
4. Consider as default in next major version

**Rationale:**
- xhtm is more actively maintained
- Compatible API reduces migration risk
- Better HTML edge case handling

### 6.3 Long-term

**Monitor ecosystem:**
- Watch for htm revival (unlikely)
- Track xhtm maintenance
- Consider standardization efforts

---

## 7. Implementation Plan

### Phase 1: Fork (Immediate)

```bash
# Option A: NPM-published fork
gh repo fork developit/htm --clone
cd htm
# Update package.json name to @voxpelli/htm
npm publish

# Option B: Vendor into project
mkdir -p lib/vendor
curl -o lib/vendor/htm.js https://raw.githubusercontent.com/developit/htm/master/dist/htm.module.js
```

### Phase 2: Integration

```javascript
// lib/htm.js - update import
// Before:
const htm = require('htm');

// After (Option A):
const htm = require('@voxpelli/htm');

// After (Option B):
const htm = require('./vendor/htm.js');
```

### Phase 3: TypeScript (Optional)

Improve type definitions:

```typescript
// lib/htm-types.d.ts
declare function htm<H extends HFunction>(
  this: H,
  strings: TemplateStringsArray,
  ...values: unknown[]
): ReturnType<H> | ReturnType<H>[];

interface HFunction {
  (type: string | Function, props: Record<string, unknown> | null, ...children: unknown[]): unknown;
}
```

---

## 8. Comparison Matrix

| Criteria | Keep htm | Fork htm | xhtm | htl | Custom |
|----------|----------|----------|------|-----|--------|
| API compatibility | ✓ 100% | ✓ 100% | ✓ ~99% | ✗ 0% | ⚠️ Variable |
| Migration effort | None | Very Low | Low | High | Very High |
| Maintenance burden | None | Low | None | N/A | High |
| Security control | ✗ | ✓ | ✗ | N/A | ✓ |
| Future-proof | ✗ | ✓ | ✓ | ✗ | ✓ |
| Type safety | ⚠️ | ⚠️ | ⚠️ | ✓ | ✓ |
| SSR compatible | ✓ | ✓ | ✓ | ✗ | ✓ |

---

## 9. Conclusion

**Fork htm** is the recommended approach because:

1. **Lowest risk** - Zero API changes
2. **Lowest effort** - 2-4 hours to implement
3. **Addresses concern** - Eliminates stale dependency
4. **Preserves compatibility** - All tests pass unchanged
5. **Enables future options** - Can migrate to xhtm later

The custom implementation option, while technically feasible, offers no benefits over forking and carries significant risk of introducing bugs or compatibility issues.

xhtm is a viable future migration target due to API compatibility, but the immediate priority should be establishing control over the dependency through forking.
