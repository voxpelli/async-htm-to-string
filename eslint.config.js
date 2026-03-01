import { voxpelli } from '@voxpelli/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...voxpelli({ noMocha: true }),
  {
    files: ['typetests/**/*.ts'],
    rules: {
      'unicorn/no-null': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'func-style': 'off',
      'n/no-sync': 'off',
    },
  },
]);
