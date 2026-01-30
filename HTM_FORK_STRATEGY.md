# HTM Fork Strategy: Vendoring vs Standalone Package

This document evaluates the trade-offs between two forking approaches for the `htm` dependency.

---

## Executive Summary

| Approach | Best For | Recommendation |
|----------|----------|----------------|
| **Vendoring** | Single project, minimal maintenance | ✅ **Recommended for this project** |
| **Standalone Package** | Multiple projects, community benefit | Consider if maintaining other htm-dependent projects |

---

## Option A: Vendoring (Inline into Project)

### What It Means

Copy htm's built files directly into the project's `lib/` directory:

```
lib/
├── vendor/
│   ├── htm.js          # 1.2KB - CJS build
│   ├── htm.mjs         # 1.2KB - ESM build  
│   ├── htm.d.ts        # Type definitions
│   └── htm-LICENSE     # Required by Apache 2.0
├── htm.js              # Existing file, updated imports
└── ...
```

### Implementation

```javascript
// lib/htm.js - Before
const htm = require('htm');

// lib/htm.js - After (vendored)
const htm = require('./vendor/htm.js');
```

### Advantages

| Advantage | Impact |
|-----------|--------|
| **Zero external dependency** | Eliminates supply chain risk entirely |
| **No npm publishing** | No package maintenance overhead |
| **Atomic updates** | Changes ship with project releases |
| **Simpler CI/CD** | No separate package pipeline |
| **Full control** | Can modify without version coordination |
| **Smaller install** | Users don't download unused htm features |

### Disadvantages

| Disadvantage | Impact | Mitigation |
|--------------|--------|------------|
| **No automatic updates** | Must manually check upstream | Low impact - htm is stable |
| **License compliance** | Must include LICENSE file | Easy - add `lib/vendor/htm-LICENSE` |
| **Code duplication** | If used in multiple projects | Only matters for multi-project |
| **Discoverability** | Others can't benefit from fixes | Low impact for maintenance fork |
| **Review burden** | Security reviewers must audit vendored code | Mitigated by small size (1.2KB) |

### Files Required

| File | Size | Purpose |
|------|------|---------|
| `htm.js` | 1,265 bytes | CJS entry point |
| `htm.mjs` | 1,207 bytes | ESM entry point |
| `htm.d.ts` | 218 bytes | TypeScript definitions |
| `htm-LICENSE` | ~11KB | Apache 2.0 (required) |
| **Total** | **~14KB** | |

### License Compliance (Apache 2.0)

Apache 2.0 requires:
1. ✅ Include copy of license → `lib/vendor/htm-LICENSE`
2. ✅ State changes made → Add header comment if modified
3. ✅ Preserve copyright notices → Included in LICENSE file
4. ✅ No trademark use → Not using "htm" as product name

---

## Option B: Standalone Package (@voxpelli/htm)

### What It Means

Fork htm to a new npm package that can be published and shared:

```
@voxpelli/htm/
├── package.json
├── index.js
├── index.mjs
├── index.d.ts
├── LICENSE
└── README.md
```

### Implementation

```javascript
// lib/htm.js - Before
const htm = require('htm');

// lib/htm.js - After (standalone package)
const htm = require('@voxpelli/htm');
```

```json
// package.json
{
  "dependencies": {
    "@voxpelli/htm": "^3.1.2"
  }
}
```

### Advantages

| Advantage | Impact |
|-----------|--------|
| **Reusable across projects** | Benefit if maintaining multiple htm users |
| **Community benefit** | Others can use the maintained fork |
| **Standard npm workflow** | Familiar dependency management |
| **Separate versioning** | Can release fixes independently |
| **Automatic deduplication** | npm dedupes if multiple packages use it |
| **Security scanning** | npm audit works normally |

### Disadvantages

| Disadvantage | Impact | Mitigation |
|--------------|--------|------------|
| **Package maintenance** | Must maintain npm package lifecycle | Overhead for single use |
| **Publishing pipeline** | Need CI/CD for the fork | Additional infrastructure |
| **Version coordination** | Must update both packages | Releases become coupled |
| **Namespace decision** | @voxpelli/htm vs htm-maintained etc. | One-time decision |
| **npm account required** | Need publishing rights | Already have for main package |
| **Discoverability confusion** | Users may not find it | Document clearly |

### Infrastructure Required

| Component | Effort | Notes |
|-----------|--------|-------|
| GitHub repo | Low | Fork or new repo |
| npm package | Low | Initial publish |
| CI/CD | Medium | Test + publish workflow |
| Documentation | Low | README explaining purpose |
| Issue tracking | Ongoing | Must monitor for issues |

---

## Comparison Matrix

| Factor | Vendoring | Standalone Package |
|--------|-----------|-------------------|
| **Initial effort** | 1-2 hours | 4-8 hours |
| **Ongoing maintenance** | Near zero | Low but nonzero |
| **Supply chain risk** | Eliminated | Shifted to your package |
| **npm audit compatibility** | ⚠️ Won't flag vendored code | ✅ Normal scanning |
| **Dependency tree** | Cleaner (one less dep) | Standard |
| **Update workflow** | Manual copy | npm update |
| **Multi-project reuse** | Copy to each | Single source |
| **Community contribution** | Not possible | Possible |
| **License complexity** | Must include LICENSE | Standard npm |
| **Published package size** | +14KB | No change |
| **Install size for users** | -246KB (no htm download) | No change |

---

## Decision Framework

### Choose Vendoring If:

- ✅ htm is only used in this one project
- ✅ You want zero external dependency risk
- ✅ You prefer simpler maintenance
- ✅ You don't expect to make significant changes
- ✅ Package size reduction is valued

### Choose Standalone Package If:

- ⬜ You maintain multiple projects using htm
- ⬜ You want to contribute back to community
- ⬜ You plan to make significant enhancements
- ⬜ You need standard npm audit workflow
- ⬜ You want others to benefit from maintenance

---

## Recommendation for async-htm-to-string

**Recommended: Vendoring**

Rationale:

1. **Single project use** - htm is only used by this library
2. **Minimal changes expected** - Only security/compatibility patches
3. **Simpler maintenance** - No separate package to manage
4. **Size benefit** - Removes 246KB from user installs
5. **Zero supply chain risk** - No external dependency to compromise

### Implementation Plan

#### Step 1: Create vendor directory

```bash
mkdir -p lib/vendor
```

#### Step 2: Copy required files

```bash
# Copy built files (not source - smaller and sufficient)
cp node_modules/htm/dist/htm.js lib/vendor/
cp node_modules/htm/dist/htm.mjs lib/vendor/
cp node_modules/htm/dist/htm.d.ts lib/vendor/
cp node_modules/htm/LICENSE lib/vendor/htm-LICENSE
```

#### Step 3: Add attribution header

```javascript
// lib/vendor/htm.js
/**
 * htm v3.1.1 - Hyperscript Tagged Markup
 * https://github.com/developit/htm
 * 
 * Copyright 2018 Google Inc.
 * Licensed under the Apache License, Version 2.0
 * See ./htm-LICENSE for full license text
 * 
 * Vendored into async-htm-to-string for maintenance stability.
 * No modifications made to original source.
 */
```

#### Step 4: Update imports

```javascript
// lib/htm.js
const htm = require('./vendor/htm.js');  // Changed from 'htm'
```

#### Step 5: Update package.json

```json
{
  "dependencies": {
    // Remove: "htm": "^3.0.4"
    "@voxpelli/typed-utils": "^3.0.0",
    "buffered-async-iterable": "^1.0.1",
    "stringify-entities": "^4.0.3"
  }
}
```

#### Step 6: Update files list

```json
{
  "files": [
    "lib/**/*.js",
    "lib/**/*.mjs",
    "lib/vendor/htm-LICENSE"  // Add this
  ]
}
```

#### Step 7: Document in AGENTS.md

Add note about vendored dependency and update process.

---

## Hybrid Approach (Future Option)

If community demand emerges, can later extract to standalone:

1. Start with vendoring (immediate need)
2. Monitor for other projects needing maintained htm
3. Extract to @voxpelli/htm if demand exists
4. Update this project to use the package

This provides flexibility without premature optimization.

---

## Appendix: Vendored Code Audit Checklist

When vendoring, document for security reviewers:

| Item | Status |
|------|--------|
| Source package | htm@3.1.1 |
| Source verified | npm registry / GitHub release |
| Integrity hash | sha512-983Vyg8N... |
| License | Apache-2.0 |
| Modifications | None |
| Last reviewed | [DATE] |
| Known vulnerabilities | None |

---

## Conclusion

For `async-htm-to-string`, **vendoring is the superior choice** because:

1. It's simpler (no package to maintain)
2. It's safer (eliminates supply chain dependency)
3. It's smaller (reduces install size by 246KB)
4. It's sufficient (only security patches needed)

The standalone package approach would only make sense if maintaining multiple htm-dependent projects or wanting to serve the broader community, neither of which applies here.
