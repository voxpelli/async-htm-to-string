# AI Agent Instructions for async-htm-to-string

> This file provides guidelines for AI coding assistants (GitHub Copilot, Cursor, etc.) working on this project.

## Project Overview

This is a **Node.js library module** that renders htm tagged templates asynchronously into strings. It's designed for server-side rendering (SSR) scenarios and follows the voxpelli Node.js module style.

### Key Characteristics

- ESM and CJS dual module support (via linemod build)
- TypeScript types written in JavaScript (JSDoc + TypeScript)
- Strict type coverage (>99%)
- Mocha + Chai testing with sinon
- Neostandard code style

---

## Code Style and Standards

### JavaScript Style

- Use ESM syntax (`import`/`export`) in `.mjs` files
- Use CommonJS syntax (`require`/`module.exports`) in `.js` files
- Follow [neostandard](https://github.com/neostandard/neostandard) JavaScript style guide
- Use single quotes for strings
- Include semicolons
- 2-space indentation

### Type Safety

- Write JavaScript for implementation, use JSDoc for type annotations
- Maintain strict type coverage (>99%)
- Hand-written type definitions go in `lib/*-types.d.ts` files
- Auto-generated `.d.ts` files are created during build (don't commit them except `index.d.ts` and `index.d.mts`)

Example of proper JSDoc typing:

```javascript
/**
 * @param {string} input - The input value
 * @param {RenderOptions} [options] - Optional configuration
 * @returns {AsyncGenerator<string>}
 */
export async function* render(input, options) {
  // implementation
}
```

### Module Structure

```
/index.js              # CJS entry point (re-exports from lib)
/index.mjs             # ESM entry point (generated via linemod)
/index.d.ts            # CJS type definitions
/index.d.mts           # ESM type definitions
/lib/*.js              # Core implementation (CJS)
/lib/*-types.d.ts      # Hand-written complex type definitions
/test/*.spec.js        # Mocha test files
```

---

## Testing

### Test Framework

- **Runner**: Mocha
- **Assertions**: Chai with chai-as-promised
- **Mocking**: Sinon with sinon-chai
- **Coverage**: c8

### Test File Structure

```javascript
/// <reference types="node" />
/// <reference types="mocha" />
/// <reference types="chai" />

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const should = chai.should();

const { render } = require('../lib/render');

describe('render()', () => {
  it('should handle basic input', async () => {
    // test implementation
  });
});
```

### Running Tests

```bash
npm test           # Full test suite with all checks
npm run test:mocha # Just the tests with coverage
npm run check      # Linting and type checking only
```

---

## Common Commands

```bash
# Install dependencies
npm install

# Run all checks and tests
npm test

# Run only linting
npm run check:1:lint

# Run only type checking
npm run check:1:tsc

# Check type coverage
npm run check:1:type-coverage

# Build type declarations
npm run build

# Clean generated files
npm run clean

# Build ESM version only (for testing)
npm run build-for-test
```

---

## Dependencies Policy

1. **Minimize dependencies** - Avoid adding dependencies unless absolutely necessary
2. **Prefer Node.js built-ins** - Use modern Node.js APIs when possible
3. **Current dependencies are intentional**:
   - `htm` - Core templating library
   - `stringify-entities` - HTML entity encoding
   - `buffered-async-iterable` - Async iteration utilities
   - `@voxpelli/typed-utils` - Type utilities

---

## Code Quality Tools

### ESLint

- Configuration: `eslint.config.mjs`
- Based on `@voxpelli/eslint-config`
- Run: `npm run check:1:lint`

### TypeScript

- Config: `tsconfig.json` (type checking)
- Config: `declaration.tsconfig.json` (declaration generation)
- Run: `npm run check:1:tsc`

### Knip

- Detects unused files, dependencies, and exports
- Configuration: `.knip.jsonc`
- Run: `npm run check:1:knip`

---

## Git and Version Control

### Commits

- Use conventional commit messages
- Husky pre-push hooks run checks
- Keep commits focused and atomic

### What to Commit

- Source `.js` files
- Hand-written type files (`index.d.ts`, `index.d.mts`, `lib/*-types.d.ts`)
- Do NOT commit auto-generated `.d.ts` files in `lib/`

---

## Anti-Patterns to Avoid

1. Don't mix module systems in the same file
2. Don't add unnecessary dependencies
3. Don't skip JSDoc type annotations
4. Don't commit auto-generated `.d.ts` files (except index ones)
5. Don't use `any` types without good reason
6. Don't skip tests for new functionality
7. Don't use `.d.ts` for implementation types - use JSDoc

## Best Practices

1. Write clear JSDoc comments with full type annotations
2. Export everything through index.js/index.mjs
3. Keep functions small and focused
4. Use async generators for streaming content
5. Validate inputs and provide helpful error messages
6. Write tests that cover edge cases
7. Follow existing code style consistently
8. Use `@ts-ignore` sparingly and with eslint disable comments when needed

---

## Node.js Version Support

- Required: `^20.11.0 || >=22.0.0`
- Use modern JavaScript features available in these versions
- No transpilation needed for runtime code

---

## Project-Specific Notes

### htm Integration

This library wraps [htm](https://github.com/developit/htm) to provide async server-side rendering. The `html` tagged template function is created by binding htm to the render function.

### Async Generators

The core rendering uses async generators to stream HTML output efficiently. When working with render functions:

```javascript
// Consuming render output
for await (const chunk of render(element)) {
  output += chunk;
}
```

### Element Types

Custom element types are defined in `lib/element-types.d.ts`. When adding new element support, update these type definitions.
