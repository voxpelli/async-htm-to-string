import { describe, it } from 'node:test';
import assert from 'node:assert';

import { html, renderToString } from '../index.js';

const BadAsync = async () => {
  return 123; // Valid, it's converted to string
};

const StringAsync = async () => {
  return 'Just String';
};

describe('async support', () => {
  it('should render async function component', async () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const AsyncComp = async (_props, _children) => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return html`<div>Async Content</div>`;
    };

    const result = await renderToString(html`<${AsyncComp} />`);
    assert.strictEqual(result, '<div>Async Content</div>');
  });

  it('should render async function component with children', async () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const AsyncComp = async (_props, children) => {
      return html`<div>${children}</div>`;
    };

    const result = await renderToString(html`<${AsyncComp}>Content</${AsyncComp}>`);
    assert.strictEqual(result, '<div>Content</div>');
  });

  it('should render direct Promise child', async () => {
    const promise = Promise.resolve('Promise Content');
    const result = await renderToString(html`${promise}`);
    assert.strictEqual(result, 'Promise Content');
  });

  it('should render Promise child returning element', async () => {
    const promise = Promise.resolve(html`<span>Delayed</span>`);
    const result = await renderToString(html`<div>${promise}</div>`);
    assert.strictEqual(result, '<div><span>Delayed</span></div>');
  });

  it('should handle async component returning number (converted to string)', async () => {
    const result = await renderToString(html`<${BadAsync} />`);
    assert.strictEqual(result, '123');
  });

  it('should handle async component returning string', async () => {
    const result = await renderToString(html`<${StringAsync} />`);
    assert.strictEqual(result, 'Just String');
  });

  it('should handle async component returning array of promises', async () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const AsyncComp = async () => {
      return [
        Promise.resolve('A'),
        Promise.resolve('B'),
      ];
    };

    const result = await renderToString(html`<div><${AsyncComp} /></div>`);
    assert.strictEqual(result, '<div>AB</div>');
  });

  it('should throw when skipStringEscape is used with non-string result', async () => {
    const element = {
      type: () => 123,
      props: {},
      children: [],
      skipStringEscape: true,
    };
    await assert.rejects(
      () => renderToString(element),
      TypeError,
      'skipStringEscape can only be used with string results'
    );
  });
});
