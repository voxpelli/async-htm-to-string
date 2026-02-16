import { voxpelli } from '@voxpelli/eslint-config';

export default [
  ...voxpelli({ cjs: false }),
  ...voxpelli({ cjs: false }).map((config) => ({
    ...config,
    files: ['packages/**/*.js'],
  })),
  {
    ignores: ['**/*.d.ts', '**/*.d.mts'],
  },
  {
    files: ['typetests/**/*.ts'],
    rules: {
      'unicorn/no-null': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'func-style': 'off',
    },
  },
];
