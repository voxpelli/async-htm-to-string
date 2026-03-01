/// <reference types="node" />
/// <reference types="mocha" />
/// <reference types="chai" />

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const should = chai.should();

const {
  h,
  html,
  rawHtml,
  renderToString,
  renderToStringSync,
} = require('..');

describe('async property tracking', () => {
  it('should set async: false on elements with string type and no children', () => {
    const el = h('div', {});
    el.should.have.property('async', false);
  });

  it('should set async: false on elements with string children', () => {
    const el = h('div', {}, 'hello', 'world');
    el.should.have.property('async', false);
  });

  it('should set async: false on elements with number children', () => {
    const el = h('div', {}, 42);
    el.should.have.property('async', false);
  });

  it('should set async: false on elements with sync element children', () => {
    const child = h('span', {}, 'text');
    const el = h('div', {}, child);
    child.should.have.property('async', false);
    el.should.have.property('async', false);
  });

  it('should not set async: false on elements with function type', () => {
    const fn = () => 'hello';
    const el = h(fn, {});
    should.not.exist(el.async);
  });

  it('should not set async: false when children include non-sync elements', () => {
    const child = h(() => 'hello', {});
    const el = h('div', {}, child);
    should.not.exist(el.async);
  });

  it('should set async: false on rawHtml elements', () => {
    const el = rawHtml`<div>raw</div>`;
    el.should.have.property('async', false);
  });

  it('should set async: false on rawHtml() with string arg', () => {
    const el = rawHtml('<div>raw</div>');
    el.should.have.property('async', false);
  });

  it('should preserve async: false through html template', () => {
    const result = html`<div class="foo">Hello</div>`;
    result.should.have.property('async', false);
  });

  it('should set async: false on nested pure-string elements via html', () => {
    const result = html`<div><span>text</span></div>`;
    result.should.have.property('async', false);
    /** @type {any} */ (result).children[0].should.have.property('async', false);
  });

  it('should not set async: false when function component is present', () => {
    const Comp = () => html`<span />`;
    const result = html`<div><${Comp} /></div>`;
    should.not.exist(/** @type {any} */ (result).async);
  });
});

describe('renderToStringSync()', () => {
  it('should render a simple sync element', () => {
    const result = renderToStringSync(html`<div>Hello</div>`);
    result.should.equal('<div>Hello</div>');
  });

  it('should render nested sync elements', () => {
    const result = renderToStringSync(html`<div><span class="foo">Bar</span></div>`);
    result.should.equal('<div><span class="foo">Bar</span></div>');
  });

  it('should render self-closing tags', () => {
    const result = renderToStringSync(html`<img src="#" />`);
    result.should.equal('<img src="#" />');
  });

  it('should escape string content', () => {
    const result = renderToStringSync(html`<div>${'<script>'}</div>`);
    result.should.equal('<div>&lt;script&gt;</div>');
  });

  it('should escape string props', () => {
    const result = renderToStringSync(html`<div foo="${'"bar"'}" />`);
    result.should.equal('<div foo="&quot;bar&quot;"></div>');
  });

  it('should handle boolean props', () => {
    const result = renderToStringSync(html`<div foo="${true}" bar="${false}" />`);
    result.should.equal('<div foo></div>');
  });

  it('should handle rawHtml in sync render', () => {
    const result = renderToStringSync(rawHtml`<div>&amp;</div>`);
    result.should.equal('<div>&amp;</div>');
  });

  it('should handle rawHtml() with string arg in sync render', () => {
    const result = renderToStringSync(rawHtml('<div>&amp;</div>'));
    result.should.equal('<div>&amp;</div>');
  });

  it('should handle sync function component via renderToStringSync', () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const Comp = () => html`<span>content</span>`;
    // Note: the outer div won't have async: false because it has a function child.
    // renderToStringSync doesn't require async: false, it just tries sync rendering.
    const el = html`<${Comp} />`;
    const result = renderToStringSync(el);
    result.should.equal('<span>content</span>');
  });

  it('should throw on Promise value', () => {
    should.Throw(
      () => renderToStringSync(Promise.resolve(html`<div />`)),
      TypeError,
      'Cannot sync-render a Promise value'
    );
  });

  it('should throw on async function component', () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const AsyncComp = async () => html`<div />`;
    const el = html`<${AsyncComp} />`;
    should.Throw(
      () => renderToStringSync(el),
      Error,
      'ASYNC_FALLBACK'
    );
  });
});

describe('renderToString() sync fast path', () => {
  it('should use sync fast path for async: false elements', async () => {
    const result = await renderToString(html`<div class="fast">Sync</div>`);
    result.should.equal('<div class="fast">Sync</div>');
  });

  it('should fall back to async path for non-sync elements', async () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const AsyncComp = async () => html`<div>Async</div>`;
    const result = await renderToString(html`<${AsyncComp} />`);
    result.should.equal('<div>Async</div>');
  });

  it('should produce same results via sync and async paths', async () => {
    const template = html`<div class="foo"><span>Hello</span><img src="#" /></div>`;
    const asyncResult = await renderToString(template);
    const syncResult = renderToStringSync(template);
    asyncResult.should.equal(syncResult);
  });

  it('should fall back gracefully when sync component returns Promise', async () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const SometimesAsync = async () => html`<span>result</span>`;
    // rawHtml has async: false, but the function component will cause ASYNC_FALLBACK
    // which renderToString catches and falls back to async path
    const result = await renderToString(html`<${SometimesAsync} />`);
    result.should.equal('<span>result</span>');
  });
});

describe('hybrid sync optimization in async path', () => {
  it('should render sync subtrees within async render', async () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const Wrapper = (_props, children) => html`<div>${children}</div>`;
    // The inner <span>Hello</span> has async: false and should be rendered
    // via the sync path even though the outer component is async
    const result = await renderToString(html`<${Wrapper}><span>Hello</span></${Wrapper}>`);
    result.should.equal('<div><span>Hello</span></div>');
  });
});
