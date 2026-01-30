# GitHub Copilot Instructions

> See also: [AGENTS.md](../AGENTS.md) in the repository root for comprehensive AI agent guidelines.

This project follows the [voxpelli Node.js module style](https://github.com/voxpelli/node-module-template/blob/main/.github/copilot-instructions.md) for library development.

## Quick Reference

| Task | Command |
|------|---------|
| Install | `npm install` |
| Full checks | `npm test` |
| Tests only | `npm run test:mocha` |
| Lint only | `npm run check:1:lint` |
| Type check | `npm run check:1:tsc` |
| Build | `npm run build` |

## Code Style

- **Style guide**: [neostandard](https://github.com/neostandard/neostandard)
- **Quotes**: Single quotes
- **Semicolons**: Yes
- **Indent**: 2 spaces
- **Module format**: CJS in `.js` (with linemod comments), ESM in `.mjs`

## Type Annotations

Use JSDoc with `@import` syntax:

```javascript
/** @import { HtmlMethodResult } from './element-types.d.ts' */

/**
 * @param {HtmlMethodResult} item
 * @returns {AsyncIterableIterator<string>}
 */
async function* render(item) { /* ... */ }
```

## Linemod Comments

When editing `lib/*.js` files, preserve linemod transformation comments:

- `// linemod-remove` - Line removed in ESM
- `// linemod-add: <code>` - Line added in ESM
- `// linemod-replace-with: <code>` - Line replaced in ESM
- `// linemod-prefix-with: <code>` - Code prefixed in ESM

## Public API

`html`, `rawHtml`, `h`, `render`, `renderToString`, `generatorToString`

## Testing

- Framework: Mocha + Chai (`should` style) + chai-as-promised + sinon
- Type tests: tsd in `index.test-d.ts`
- Coverage: c8 (aim for >99% type coverage)

## Key Constraints

1. Don't add dependencies without strong justification
2. Don't break linemod comments
3. Don't use `any` types
4. Don't skip JSDoc annotations
5. Don't commit generated files (except `index.d.ts`, `index.d.mts`)
6. Always run `npm test` before committing
