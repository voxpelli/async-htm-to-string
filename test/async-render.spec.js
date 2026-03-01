import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  html,
  renderToString,
} from '../index.js';

const BadAsync = async () => {
  return 123; // Valid, it's converted to string
};

const StringAsync = async () => {
  return 'Just String';
};

// eslint-disable-next-line unicorn/no-null
const NullComp = () => null;
const UndefComp = () => {};

describe('async support', () => {
  it('should render async function component', async () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const AsyncComp = async (_props, _children) => {
      // simulate work
      await new Promise(resolve => setTimeout(resolve, 1));
      return html`<div>Async Content</div>`;
    };

    assert.equal(await renderToString(html`<${AsyncComp} />`), '<div>Async Content</div>');
  });

  it('should render async function component with children', async () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const AsyncComp = async (_props, children) => {
      return html`<div>${children}</div>`;
    };

    assert.equal(await renderToString(html`<${AsyncComp}>Content</${AsyncComp}>`), '<div>Content</div>');
  });

  it('should render direct Promise child', async () => {
    const promise = Promise.resolve('Promise Content');
    // @ts-ignore — testing runtime Promise child handling
    assert.equal(await renderToString(html`${promise}`), 'Promise Content');
  });

  it('should render Promise child returning element', async () => {
    const promise = Promise.resolve(html`<span>Delayed</span>`);
    // @ts-ignore — testing runtime Promise child handling
    assert.equal(await renderToString(html`<div>${promise}</div>`), '<div><span>Delayed</span></div>');
  });

  it('should handle async component returning non-string/element (error)', async () => {
    // @ts-ignore — testing runtime behavior with component returning number
    assert.equal(await renderToString(html`<${BadAsync} />`), '123');
  });

  it('should handle async component returning string', async () => {
    assert.equal(await renderToString(html`<${StringAsync} />`), 'Just String');
  });

  it('should handle async component returning array of promises', async () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const AsyncComp = async () => {
      return [
        Promise.resolve('A'),
        Promise.resolve('B'),
      ];
    };

    assert.equal(await renderToString(html`<div><${AsyncComp} /></div>`), '<div>AB</div>');
  });

  it('should handle promise rejection in children', async () => {
    // @ts-ignore — testing runtime Promise rejection handling
    await assert.rejects(renderToString(html`<div>${Promise.reject(new Error('boom'))}</div>`), { name: 'Error', message: 'boom' });
  });

  it('should handle function component returning null', async () => {
    // @ts-ignore — testing runtime behavior with component returning null
    assert.equal(await renderToString(html`<div><${NullComp} /></div>`), '<div></div>');
  });

  it('should handle function component returning undefined', async () => {
    // @ts-ignore — testing runtime behavior with component returning void
    assert.equal(await renderToString(html`<div><${UndefComp} /></div>`), '<div></div>');
  });

  it('should throw when skipStringEscape is used with non-string result', async () => {
    const element = {
      type: () => 123,
      props: {},
      children: [],
      skipStringEscape: true,
    };
    // @ts-ignore
    await assert.rejects(renderToString(element), { name: 'TypeError', message: 'skipStringEscape can only be used with string results' });
  });
});
