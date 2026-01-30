import { voxpelli } from '@voxpelli/eslint-config';

export default [
  ...voxpelli({ cjs: true }),
  {
    // Allow null in htm-improved to maintain API compatibility with original htm.
    // The original htm uses null for "no props" which is the standard convention
    // for React's createElement, Preact's h, and other hyperscript implementations.
    files: ['packages/htm-improved/**/*.js', 'test/vendor-htm.spec.js'],
    rules: {
      'unicorn/no-null': 'off',
    },
  },
];
