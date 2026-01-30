import { voxpelli } from '@voxpelli/eslint-config';

export default [
  ...voxpelli({ cjs: true }),
  {
    // Allow null in vendored htm to maintain API compatibility with original htm.
    // The original htm uses null for "no props" which is the standard convention
    // for React's createElement, Preact's h, and other hyperscript implementations.
    files: ['lib/vendor/htm.js', 'test/vendor-htm.spec.js'],
    rules: {
      'unicorn/no-null': 'off',
    },
  },
];
