/* eslint-disable n/no-sync */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  h,
  html,
  rawHtml,
  render,
  renderSync,
  renderToString,
  renderToStringSync,
  generatorToString,
} from '../index.js';

// eslint-disable-next-line unicorn/no-thenable
const thenable = { then: (/** @type {(v: string) => void} */ resolve) => resolve('thenable result') };

/** @type {import('../index.js').SimpleRenderableElementFunction} */
const ThenableComp = () => /** @type {any} */ (thenable);

function * syncGen () { yield 'x'; yield 'y'; }
async function * asyncGen () { yield 'a'; }
async function * asyncStringGen () { yield 'hello'; yield ' '; yield 'world'; }
async function * emptyAsyncGen () { /* empty */ }
function * syncStringGen () { yield 'a'; yield 'b'; }

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

  it('should render fragment with null interpolations', () => {
    const element = html`<div>content</div>`;
    // eslint-disable-next-line unicorn/no-null
    const result = renderToStringSync(html`${element}${null}${null}`);
    assert.equal(result, '<div>content</div>');
  });

  it('should render fragment with false interpolations', () => {
    const element = html`<span>a</span>`;
    const result = renderToStringSync(html`${element}${false}`);
    assert.equal(result, '<span>a</span>');
  });

  it('should render fragment in sync path', () => {
    const result = renderToStringSync(html`<><div>a</div></>`);
    assert.equal(result, '<div>a</div>');
  });

  it('should render empty string as no output', () => {
    const result = renderToStringSync('');
    assert.equal(result, '');
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

describe('thenable handling in sync path', () => {
  it('should fall back to async when component returns thenable (non-native Promise)', async () => {
    const result = await renderToString(html`<${ThenableComp} />`);
    assert.equal(result, 'thenable result');
  });

  it('should throw TypeError via renderToStringSync when component returns thenable', () => {
    assert.throws(
      () => renderToStringSync(html`<${ThenableComp} />`),
      { name: 'TypeError', message: /async component/i }
    );
  });
});

describe('iterable handling in sync path', () => {
  it('should render Set children synchronously', () => {
    const set = new Set(['a', 'b']);
    // @ts-ignore — testing runtime behavior with Set child
    const result = renderToStringSync({ type: 'div', props: {}, children: [set], async: false });
    assert.equal(result, '<div>ab</div>');
  });

  it('should render generator children synchronously', () => {
    // @ts-ignore — testing runtime behavior with generator child
    const result = renderToStringSync({ type: 'div', props: {}, children: [syncGen()], async: false });
    assert.equal(result, '<div>xy</div>');
  });

  it('should render Set children via async path too', async () => {
    const set = new Set(['a', 'b']);
    const result = await renderToString(html`<div>${set}</div>`);
    assert.equal(result, '<div>ab</div>');
  });

  it('should render generator children via async path too', async () => {
    // @ts-ignore — testing runtime behavior with generator child
    const result = await renderToString(html`<div>${syncGen()}</div>`);
    assert.equal(result, '<div>xy</div>');
  });

  it('should throw on async iterable in sync render', () => {
    assert.throws(
      // @ts-ignore — testing runtime behavior with async iterable child
      () => renderToStringSync({ type: 'div', props: {}, children: [asyncGen()], async: false }),
      { name: 'TypeError', message: /async component/i }
    );
  });
});

describe('skipStringEscape in sync path', () => {
  it('should throw when skipStringEscape is used with non-string result in sync path', () => {
    const element = {
      type: () => 123,
      props: {},
      children: [],
      skipStringEscape: true,
    };
    assert.throws(
      // @ts-ignore
      () => renderToStringSync(element),
      { name: 'TypeError', message: 'skipStringEscape can only be used with string results' }
    );
  });
});

describe('renderSync()', () => {
  it('should render array input', () => {
    const result = renderSync([
      { type: 'div', props: {}, children: ['a'], async: false },
      { type: 'span', props: {}, children: ['b'], async: false },
    ]);
    assert.equal(result, '<div>a</div><span>b</span>');
  });

  it('should render string input', () => {
    const result = renderSync({ type: 'div', props: {}, children: ['hello'], async: false });
    assert.equal(result, '<div>hello</div>');
  });
});

describe('render() with Promise input', () => {
  it('should handle Promise input', async () => {
    const result = await generatorToString(render(Promise.resolve(html`<div>resolved</div>`)));
    assert.equal(result, '<div>resolved</div>');
  });
});

describe('invalid tag/attribute in sync path', () => {
  it('should throw on invalid tag name in sync render', () => {
    assert.throws(
      () => renderToStringSync({ type: '-bad', props: {}, children: [], async: false }),
      { message: 'Invalid tag name: -bad' }
    );
  });

  it('should throw on invalid attribute name in sync render', () => {
    assert.throws(
      () => renderToStringSync({ type: 'div', props: { '-bad': 'val' }, children: [], async: false }),
      { message: 'Invalid attribute name: -bad' }
    );
  });
});

describe('generatorToString()', () => {
  it('should concatenate async iterable strings', async () => {
    const result = await generatorToString(asyncStringGen());
    assert.equal(result, 'hello world');
  });

  it('should handle empty async iterable', async () => {
    const result = await generatorToString(emptyAsyncGen());
    assert.equal(result, '');
  });

  it('should handle sync iterable', async () => {
    const result = await generatorToString(syncStringGen());
    assert.equal(result, 'ab');
  });
});
