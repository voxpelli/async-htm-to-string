# GitHub Copilot Instructions

> See also: [AGENTS.md](../AGENTS.md) in the repository root for universal AI agent guidelines.

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
- **Module format**: CJS in `.js`, ESM in `.mjs`

## Type Annotations

Use JSDoc for types in JavaScript:

```javascript
/**
 * @param {string} input
 * @param {RenderOptions} [options]
 * @returns {AsyncGenerator<string>}
 */
export async function* render(input, options) {
  // implementation
}
```

## Testing

- Framework: Mocha + Chai + chai-as-promised + sinon
- Location: `test/*.spec.js`
- Coverage: c8 (aim for >99% type coverage)

## Key Constraints

1. Don't add dependencies without strong justification
2. Don't use `any` types
3. Don't skip JSDoc annotations
4. Don't commit generated `.d.ts` files (except `index.d.ts`, `index.d.mts`)
5. Always run `npm test` before committing
