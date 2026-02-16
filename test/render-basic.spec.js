import { describe, it } from 'node:test';
import assert from 'node:assert';

import { render } from '../lib/render.mjs';
import { ELEMENT_FIXTURE } from './fixtures.js';

describe('render() basic', () => {
  it('should throw on no argument', async () => {
    await assert.rejects(
      // eslint-disable-next-line no-unused-vars, no-empty
      async () => { for await (const _ of render()) {} },
      TypeError,
      'Expected an argument'
    );
  });

  it('should throw on null argument', async () => {
    await assert.rejects(
      // eslint-disable-next-line no-unused-vars, no-empty, unicorn/no-null
      async () => { for await (const _ of render(null)) {} },
      TypeError,
      'Expected a non-falsy argument, got: null'
    );
  });

  it('should throw on empty string argument', async () => {
    await assert.rejects(
      // eslint-disable-next-line no-unused-vars, no-empty
      async () => { for await (const _ of render('')) {} },
      TypeError,
      'Expected a non-falsy argument, got: '
    );
  });

  it('should throw on unsupported argument', async () => {
    await assert.rejects(
      // eslint-disable-next-line no-unused-vars, no-empty
      async () => { for await (const _ of render(true)) {} },
      TypeError,
      'Expected a string or an object, got: boolean'
    );
  });

  it('should return an async iterator', async () => {
    const result = render(ELEMENT_FIXTURE);
    assert.ok(result);
    assert.ok(typeof result === 'object');
    assert.ok(result[Symbol.asyncIterator]);
  });

  it('should return sensible values', async () => {
    const total = [];

    for await (const chunk of render(ELEMENT_FIXTURE)) {
      assert.ok(chunk);
      assert.strictEqual(typeof chunk, 'string');
      assert.ok(chunk.length > 0);
      total.push(chunk);
    }

    assert.deepStrictEqual(total, ['<div', '>', '</div>']);
  });
});
