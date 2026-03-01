/* eslint-disable n/no-sync */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  h,
  html,
  rawHtml,
  renderToString,
  renderToStringSync,
} from '../index.js';

describe('async property tracking', () => {
  it('should set async: false on elements with string type and no children', () => {
    const el = h('div', {});
    assert.equal(el.async, false, 'expected async: false');
  });

  it('should set async: false on elements with string children', () => {
    const el = h('div', {}, 'hello', 'world');
    assert.equal(el.async, false, 'expected async: false');
  });

  it('should set async: false on elements with number children', () => {
    const el = h('div', {}, 42);
    assert.equal(el.async, false, 'expected async: false');
  });

  it('should set async: false on elements with sync element children', () => {
    const child = h('span', {}, 'text');
    const el = h('div', {}, child);
    assert.equal(child.async, false, 'child should be async: false');
    assert.equal(el.async, false, 'parent should be async: false');
  });

  it('should set async: false on elements with null/undefined/false children', () => {
    // @ts-expect-error — testing runtime behavior with falsy children not in RenderableElement type
    // eslint-disable-next-line unicorn/no-null
    const el = h('div', {}, null, undefined, false, 'text');
    assert.equal(el.async, false, 'expected async: false');
  });

  it('should not set async: false on elements with function type', () => {
    const el = h(() => 'hello', {});
    assert.equal(el.async, undefined, 'expected no async property');
  });

  it('should not set async: false when children include non-sync elements', () => {
    const child = h(() => 'hello', {});
    const el = h('div', {}, child);
    assert.equal(el.async, undefined, 'expected no async property');
  });

  it('should set async: false on rawHtml elements', () => {
    const el = rawHtml`<div>raw</div>`;
    assert.equal(el.async, false, 'expected async: false');
  });

  it('should set async: false on rawHtml() with string arg', () => {
    const el = rawHtml('<div>raw</div>');
    assert.equal(el.async, false, 'expected async: false');
  });

  it('should preserve async: false through html template', () => {
    const result = html`<div class="foo">Hello</div>`;
    assert.equal(/** @type {any} */ (result).async, false, 'expected async: false');
  });

  it('should set async: false on nested pure-string elements via html', () => {
    const result = html`<div><span>text</span></div>`;
    assert.equal(/** @type {any} */ (result).async, false, 'parent should be async: false');
    assert.equal(/** @type {any} */ (result).children[0].async, false, 'child should be async: false');
  });

  it('should not set async: false when function component is present', () => {
    const Comp = () => html`<span />`;
    const result = html`<div><${Comp} /></div>`;
    assert.equal(/** @type {any} */ (result).async, undefined, 'expected no async property');
  });
});

describe('renderToStringSync()', () => {
  it('should render a simple sync element', () => {
    const result = renderToStringSync(html`<div>Hello</div>`);
    assert.equal(result, '<div>Hello</div>');
  });

  it('should render nested sync elements', () => {
    const result = renderToStringSync(html`<div><span class="foo">Bar</span></div>`);
    assert.equal(result, '<div><span class="foo">Bar</span></div>');
  });

  it('should render self-closing tags', () => {
    const result = renderToStringSync(html`<img src="#" />`);
    assert.equal(result, '<img src="#" />');
  });

  it('should handle boolean props', () => {
    const result = renderToStringSync(html`<div foo="${true}" bar="${false}" />`);
    assert.equal(result, '<div foo></div>');
  });

  it('should handle rawHtml in sync render', () => {
    const result = renderToStringSync(rawHtml`<div>&amp;</div>`);
    assert.equal(result, '<div>&amp;</div>');
  });

  it('should handle rawHtml() with string arg in sync render', () => {
    const result = renderToStringSync(rawHtml('<div>&amp;</div>'));
    assert.equal(result, '<div>&amp;</div>');
  });

  it('should handle sync function component via renderToStringSync', () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const Comp = () => html`<span>content</span>`;
    const el = html`<${Comp} />`;
    const result = renderToStringSync(el);
    assert.equal(result, '<span>content</span>');
  });

  it('should render empty array children', () => {
    // @ts-ignore
    const el = { type: 'div', props: {}, children: [], async: false };
    const result = renderToStringSync(el);
    assert.equal(result, '<div></div>');
  });

  it('should render fragment in sync path', () => {
    const result = renderToStringSync(html`<><div>a</div></>`);
    assert.equal(result, '<div>a</div>');
  });

  it('should throw on Promise value', () => {
    assert.throws(
      () => renderToStringSync(Promise.resolve(html`<div />`)),
      { name: 'TypeError', message: 'Cannot sync-render a Promise value' }
    );
  });

  it('should throw descriptive error on async function component', () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const AsyncComp = async () => html`<div />`;
    const el = html`<${AsyncComp} />`;
    assert.throws(
      () => renderToStringSync(el),
      { name: 'TypeError', message: /async component/i }
    );
  });
});

describe('renderToString() sync fast path', () => {
  it('should use sync fast path for async: false elements', async () => {
    const result = await renderToString(html`<div class="fast">Sync</div>`);
    assert.equal(result, '<div class="fast">Sync</div>');
  });

  it('should fall back to async path for non-sync elements', async () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const AsyncComp = async () => html`<div>Async</div>`;
    const result = await renderToString(html`<${AsyncComp} />`);
    assert.equal(result, '<div>Async</div>');
  });

  it('should produce same results via sync and async paths', async () => {
    const template = html`<div class="foo"><span>Hello</span><img src="#" /></div>`;
    const asyncResult = await renderToString(template);
    const syncResult = renderToStringSync(template);
    assert.equal(asyncResult, syncResult, 'sync and async should produce identical output');
  });

  it('should fall back gracefully when sync component returns Promise', async () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const SometimesAsync = async () => html`<span>result</span>`;
    const result = await renderToString(html`<${SometimesAsync} />`);
    assert.equal(result, '<span>result</span>');
  });
});

describe('hybrid sync optimization in async path', () => {
  it('should render sync subtrees within async render', async () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const Wrapper = (_props, children) => html`<div>${children}</div>`;
    const result = await renderToString(html`<${Wrapper}><span>Hello</span></${Wrapper}>`);
    assert.equal(result, '<div><span>Hello</span></div>');
  });

  it('should fall back to async path when sync subtree contains async component', async () => {
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const AsyncComp = async () => html`<span>async</span>`;
    const asyncChild = { type: AsyncComp, props: {}, children: [] };
    /** @type {import('../index.js').SimpleRenderableElementFunction} */
    const Wrapper = () => ({ type: 'div', props: {}, children: [asyncChild], async: false });
    const el = { type: Wrapper, props: {}, children: [], async: false };
    const result = await renderToString(html`<section>${el}</section>`);
    assert.ok(result.includes('<span>async</span>'), 'should contain async component output');
  });
});
