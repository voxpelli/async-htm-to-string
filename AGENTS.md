# AGENTS.md

> Instructions for AI coding agents working on this project.

This is a Node.js library that renders [htm](https://github.com/developit/htm) tagged templates asynchronously into strings for server-side rendering. It follows the [voxpelli Node.js module style](https://github.com/voxpelli/node-module-template/blob/main/.github/copilot-instructions.md).

## Dev environment

- Node.js `^20.11.0 || >=22.0.0` required
- Run `npm install` to set up dependencies
- This project uses both CJS (`.js`) and ESM (`.mjs`) - the ESM version is generated via `linemod`

## Code style

- Follow [neostandard](https://github.com/neostandard/neostandard): single quotes, semicolons, 2-space indent
- Use CommonJS (`require`/`module.exports`) in `.js` files
- Use ESM (`import`/`export`) in `.mjs` files
- Write implementation in JavaScript with JSDoc type annotations
- Maintain >99% type coverage

Example JSDoc typing:
```javascript
/**
 * @param {string} input - The input value
 * @returns {AsyncGenerator<string>}
 */
export async function* render(input) {
  // implementation
}
```

## Testing

- Run `npm test` for full checks (lint + types + tests)
- Run `npm run test:mocha` for just tests with coverage
- Run `npm run check:1:lint` for linting only
- Run `npm run check:1:tsc` for type checking only

Test files use Mocha + Chai with chai-as-promised and sinon:
```javascript
/// <reference types="mocha" />
/// <reference types="chai" />
'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('feature', () => {
  it('should work', async () => {
    // test
  });
});
```

## Building

- `npm run build` - Clean and generate type declarations
- `npm run build-for-test` - Build ESM version only (for testing)
- `npm run clean` - Remove generated files

## File structure

```
index.js / index.mjs     # Entry points (CJS/ESM)
index.d.ts / index.d.mts # Type definitions (hand-written, commit these)
lib/*.js                 # Implementation
lib/*-types.d.ts         # Complex type definitions (hand-written)
test/*.spec.js           # Test files
```

## What to commit

- Source `.js` files
- Hand-written type files: `index.d.ts`, `index.d.mts`, `lib/*-types.d.ts`
- Do NOT commit auto-generated `.d.ts` files in `lib/`

## Dependencies

- Avoid adding dependencies unless absolutely necessary
- Prefer Node.js built-in APIs
- Current deps are intentional: `htm`, `stringify-entities`, `buffered-async-iterable`, `@voxpelli/typed-utils`

## Anti-patterns

- Don't mix module systems in the same file
- Don't skip JSDoc type annotations
- Don't use `any` types without good reason
- Don't skip tests for new functionality
- Don't commit auto-generated `.d.ts` files

## PR guidelines

- Use conventional commit messages
- Husky pre-push hooks will run checks automatically
- All checks must pass: `npm test`
- Keep commits focused and atomic
