import { describe, it } from 'node:test';
import assert from 'node:assert';

import { renderProps } from '../index.js';

async function collect (iter) {
  const chunks = [];
  for await (const chunk of iter) {
    chunks.push(chunk);
  }
  return chunks.join('');
}

describe('renderProps', () => {
  it('should render string props', async () => {
    const result = await collect(renderProps({ foo: 'bar' }));
    assert.strictEqual(result, ' foo="bar"');
  });

  it('should render boolean true as shorthand', async () => {
    const result = await collect(renderProps({ disabled: true }));
    assert.strictEqual(result, ' disabled');
  });

  it('should skip boolean false', async () => {
    const result = await collect(renderProps({ disabled: false }));
    assert.strictEqual(result, '');
  });

  it('should escape string values', async () => {
    const result = await collect(renderProps({ foo: '"bar"' }));
    assert.strictEqual(result, ' foo="&quot;bar&quot;"');
  });

  it('should throw on invalid attribute name', async () => {
    await assert.rejects(
      () => collect(renderProps({ '-invalid': 'x' })),
      { name: 'Error', message: 'Invalid attribute name: -invalid' }
    );
  });
});
