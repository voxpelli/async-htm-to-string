import { describe, it } from 'node:test';
import assert from 'node:assert';

import { renderStringItem } from '../index.js';

async function collect (iter) {
  const chunks = [];
  for await (const chunk of iter) {
    chunks.push(chunk);
  }
  return chunks.join('');
}

async function * renderChildren (children) {
  for (const child of children) {
    if (typeof child === 'string') {
      yield child;
    }
  }
}

describe('renderStringItem', () => {
  it('should render div with children', async () => {
    const result = await collect(renderStringItem(
      { type: 'div', props: {}, children: ['hello'] },
      renderChildren
    ));
    assert.strictEqual(result, '<div>hello</div>');
  });

  it('should render self-closing img', async () => {
    const result = await collect(renderStringItem(
      { type: 'img', props: { src: '#' }, children: [] },
      renderChildren
    ));
    assert.strictEqual(result, '<img src="#" />');
  });

  it('should render self-closing IMG (case-insensitive)', async () => {
    const result = await collect(renderStringItem(
      { type: 'IMG', props: { src: '#' }, children: [] },
      renderChildren
    ));
    assert.strictEqual(result, '<img src="#" />');
  });

  it('should throw on invalid tag', async () => {
    await assert.rejects(
      () => collect(renderStringItem(
        { type: '-div', props: {}, children: [] },
        renderChildren
      )),
      { name: 'Error', message: 'Invalid tag name: -div' }
    );
  });
});
