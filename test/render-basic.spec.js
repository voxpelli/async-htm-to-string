import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { render } from '../lib/render.js';

import { ELEMENT_FIXTURE } from './fixtures.js';

describe('render() basic', () => {
  it('should throw on no argument', async () => {
    await assert.rejects(async () => {
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const _foo of render()) {}
    }, { name: 'TypeError', message: 'Expected an argument' });
  });

  it('should throw on null argument', async () => {
    await assert.rejects(async () => {
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, no-empty, unicorn/no-null
      for await (const _foo of render(null)) {}
    }, { name: 'TypeError', message: 'Expected a non-falsy argument, got: null' });
  });

  it('should throw on empty string argument', async () => {
    await assert.rejects(async () => {
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const _foo of render('')) {}
    }, { name: 'TypeError', message: 'Expected a non-falsy argument, got: ' });
  });

  it('should throw on unsupported argument', async () => {
    await assert.rejects(async () => {
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const _foo of render(true)) {}
    }, { name: 'TypeError', message: 'Expected a string or an object, got: boolean' });
  });

  it('should return an async iterator', async () => {
    const result = render(ELEMENT_FIXTURE);
    // eslint-disable-next-line unicorn/no-null
    assert.ok(result != null);
    assert.equal(typeof result, 'object');
    // eslint-disable-next-line unicorn/no-null
    assert.ok(result[Symbol.asyncIterator] != null);
  });

  it('should return sensible values', async () => {
    const total = [];

    for await (const result of render(ELEMENT_FIXTURE)) {
      // eslint-disable-next-line unicorn/no-null
      assert.ok(result != null);
      assert.equal(typeof result, 'string');
      assert.ok(result.length > 0);

      total.push(result);
    }

    assert.deepEqual(total, ['<div>', '</div>']);
  });
});
