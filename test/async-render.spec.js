/// <reference types="node" />
/// <reference types="mocha" />
/// <reference types="chai" />

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

const {
  html,
  renderToString,
} = require('..');

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
      // simulate work
      await new Promise(resolve => setTimeout(resolve, 1));
      return html`<div>Async Content</div>`;
    };

    await renderToString(html`<${AsyncComp} />`)
      .should.eventually.equal('<div>Async Content</div>');
  });

  it('should render async function component with children', async () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const AsyncComp = async (_props, children) => {
      return html`<div>${children}</div>`;
    };

    await renderToString(html`<${AsyncComp}>Content</${AsyncComp}>`)
      .should.eventually.equal('<div>Content</div>');
  });

  it('should render direct Promise child', async () => {
    const promise = Promise.resolve('Promise Content');
    // We wrap it in a div or just render it directly
    await renderToString(html`${promise}`)
      .should.eventually.equal('Promise Content');
  });

  it('should render Promise child returning element', async () => {
    const promise = Promise.resolve(html`<span>Delayed</span>`);
    await renderToString(html`<div>${promise}</div>`)
      .should.eventually.equal('<div><span>Delayed</span></div>');
  });

  it('should handle async component returning non-string/element (error)', async () => {
    await renderToString(html`<${BadAsync} />`)
      .should.eventually.equal('123');
  });

  it('should handle async component returning string', async () => {
    await renderToString(html`<${StringAsync} />`)
      .should.eventually.equal('Just String');
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

    await renderToString(html`<div><${AsyncComp} /></div>`)
      .should.eventually.equal('<div>AB</div>');
  });

  it('should throw when skipStringEscape is used with non-string result', async () => {
    const element = {
      type: () => 123,
      props: {},
      children: [],
      skipStringEscape: true,
    };
    // @ts-ignore
    await renderToString(element).should.be.rejectedWith(TypeError, 'skipStringEscape can only be used with string results');
  });
});
