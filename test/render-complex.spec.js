/// <reference types="node" />
/// <reference types="mocha" />
/// <reference types="chai" />

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();

process.on('unhandledRejection', reason => { throw reason; });

const {
  html,
  rawHtml,
  renderToString,
} = require('..');

const {
  ELEMENT_FIXTURE_INVALID_TYPE,
  ELEMENT_FIXTURE_WITH_COMPLEX_PROPS,
} = require('./fixtures');

describe('renderToString()', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('complex', () => {
    it('should be able to render a complex example', async () => {
      const foo = 'woot';
      /** @type {import('..').SimpleRenderableElementFunction} */
      const abc = (_props, children) => html`<cool>${children}</cool>`;
      /** @type {import('..').SimpleRenderableElementFunction} */
      const bar = (_props, children) => html`<wowzors class="wow"><${abc}>${children}<//></wowzors>`;
      const danger = '<div>w0000000000t</div>';
      const wow = html`<div class="${['prop1', 'prop2'].join(' ')}" data-foo="123">  <img src="#" /> <${bar}>    <${foo}>YEA&H!${danger}</${foo}></${bar}></div>`;

      return renderToString(wow)
        .should.eventually.equal('<div class="prop1 prop2" data-foo="123">  <img src="#" /> <wowzors class="wow"><cool>    <woot>YEA&amp;H!&lt;div&gt;w0000000000t&lt;/div&gt;</woot></cool></wowzors></div>');
    });

    it('should handle multiple roots', async () => {
      await renderToString(html`<div /><div />`)
        .should.eventually.equal('<div></div><div></div>');
    });

    it('should handle plain string', async () => {
      await renderToString(html`foo`)
        .should.eventually.equal('foo');
    });
  });

  describe('tags', () => {
    it('should throw on invalid tag name', async () => {
      await renderToString(html`<-div></-div>`)
        .should.be.rejectedWith('Invalid tag name: -div');
    });

    it('should throw on invalid tag type', async () => {
      // @ts-ignore
      await renderToString(ELEMENT_FIXTURE_INVALID_TYPE)
        .should.be.rejectedWith('Invalid element type: boolean');
    });

    it('should handle string variable tag type', async () => {
      const foo = 'bar';
      await renderToString(html`<${foo}></${foo}>`)
        .should.eventually.equal('<bar></bar>');
    });

    it('should render self-closing tags correctly', async () => {
      await renderToString(html`<img src="#" />`)
        .should.eventually.equal('<img src="#" />');
    });

    it('should handle self-closing tag with closing tag correctly', async () => {
      await renderToString(html`<img src="#"></img>`)
        .should.eventually.equal('<img src="#" />');
    });

    it('should be able to render a fragment example', async () => {
      const wow = html`<><div></div></>`;

      await renderToString(wow)
        .should.eventually.equal('<div></div>');
    });

    it('should be able to handle a non-named closing tag', async () => {
      const wow = html`<div>content here<//>`;

      return renderToString(wow)
        .should.eventually.equal('<div>content here</div>');
    });
  });

  describe('tag function', () => {
    it('should handle function tag type', async () => {
      /** @type {import('..').SimpleRenderableElementFunction} */
      const foo = sinon.stub().returns(html`<abc />`);

      await renderToString(html`<${foo} />`)
        .should.eventually.equal('<abc></abc>');

      foo.should.have.been.calledOnce.and.calledOnceWithExactly({}, []);
    });

    it('should handle function tag with children', async () => {
      const foo = sinon.stub().returnsArg(1);
      const wow = html`<${foo}>content here</${foo}>`;

      await renderToString(wow)
        .should.eventually.equal('content here');

      foo.should.have.been.calledOnce.and.calledOnceWithExactly({}, ['content here']);
    });

    it('should handle function tag with props', async () => {
      const foo = sinon.stub().returns(html`<abc />`);
      const wow = html`<${foo} foo="bar" />`;

      await renderToString(wow)
        .should.eventually.equal('<abc></abc>');

      foo.should.have.been.calledOnce.and.calledOnceWithExactly({ foo: 'bar' }, []);
    });
  });

  describe('children', () => {
    it('should throw on invalid child type', async () => {
      await renderToString(html`<div>${true}</div>`)
        .should.be.rejectedWith('Invalid render item type: boolean');
    });

    it('should throw on invalid child object', async () => {
      // @ts-ignore
      await renderToString(html`<div>${{ abc: 123 }}</div>`)
        .should.be.rejectedWith('Not an element definition. Missing type in: {"abc":123}');
    });

    it('should handle undefined child', async () => {
      await renderToString(html`<div>${undefined}</div>`)
        .should.eventually.equal('<div></div>');
    });

    it('should handle null child', async () => {
      // @ts-ignore
      // eslint-disable-next-line unicorn/no-null
      await renderToString(html`<div>${null}</div>`)
        .should.eventually.equal('<div></div>');
    });

    it('should handle text variable child', async () => {
      await renderToString(html`<div>${'foo'}</div>`)
        .should.eventually.equal('<div>foo</div>');
    });

    it('should handle text non-variable child', async () => {
      await renderToString(html`<div>foo</div>`)
        .should.eventually.equal('<div>foo</div>');
    });

    it('should handle text combined child', async () => {
      await renderToString(html`<div>${'foo'} bar</div>`)
        .should.eventually.equal('<div>foo bar</div>');
    });

    it('should handle number child', async () => {
      await renderToString(html`<div>${1}</div>`)
        .should.eventually.equal('<div>1</div>');
    });

    it('should handle element child', async () => {
      await renderToString(html`<div><img /></div>`)
        .should.eventually.equal('<div><img /></div>');
    });

    it('should custom element child', async () => {
      const foo = sinon.stub().returns(html`<abc />`);

      await renderToString(html`<div><${foo} /></div>`)
        .should.eventually.equal('<div><abc></abc></div>');
    });

    it('should handle array child', async () => {
      await renderToString(html`<ul>${['foo', 'bar'].flatMap(i => html`<li>${i}</li>`)}</ul>`)
        .should.eventually.equal('<ul><li>foo</li><li>bar</li></ul>');
    });

    it('should have comments ignored', async () => {
      await renderToString(html`<div><!-- foobar --></div>`)
        .should.eventually.equal('<div></div>');
    });

    it('should handle output as input', async () => {
      const foo = html`<foo />`;
      await renderToString(html`<div>${foo}</div>`)
        .should.eventually.equal('<div><foo></foo></div>');
    });
  });

  describe('properties', () => {
    it('should throw on invalid property name', async () => {
      await renderToString(html`<div -cool="123"></div>`)
        .should.be.rejectedWith('Invalid attribute name: -cool');
    });

    it('should be able to render boolean props', async () => {
      await renderToString(html`<div foo="${true}" bar="${false}" abc></div>`)
        .should.eventually.equal('<div foo abc></div>');
    });

    it('should be able to render numeric props', async () => {
      await renderToString(html`<div foo="${0}" bar="${123}" abc="${0.001}" xyz="0" cde="123"></div>`)
        .should.eventually.equal('<div foo="0" bar="123" abc="0.001" xyz="0" cde="123"></div>');
    });

    it('should handle empty string props', async () => {
      await renderToString(html`<div foo="${''}" xyz=""></div>`)
        .should.eventually.equal('<div foo="" xyz=""></div>');
    });

    it('should be able to render string props', async () => {
      await renderToString(html`<div foo="${'bar'}" xyz="abc"></div>`)
        .should.eventually.equal('<div foo="bar" xyz="abc"></div>');
    });

    it('should escape string props', async () => {
      await renderToString(html`<div foo="${'"bar"'}" yay="${'<div>'}" xyz="ab&c"></div>`)
        .should.eventually.equal('<div foo="&quot;bar&quot;" yay="&lt;div&gt;" xyz="ab&amp;c"></div>');
    });

    it('should escape string content', async () => {
      await renderToString(html`<div>${'"bar"'}${'<div>'}ab&c</div>`)
        .should.eventually.equal('<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>');
    });

    it('should not escape raw html given through template literal rawHtml``', async () => {
      await renderToString(rawHtml`<div>${'&quot;bar&quot;'}&lt;div&gt;ab&amp;c</div>`)
        .should.eventually.equal('<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>');
    });

    it('should not escape raw html given through direct call to rawHtml()', async () => {
      await renderToString(rawHtml('<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>'))
        .should.eventually.equal('<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>');
    });

    it('should support rawHtml() as child content in ordinary html', async () => {
      await renderToString(html`<div>${'<div>'}${rawHtml`<div>`}${rawHtml('<div>')}</div>`)
        .should.eventually.equal('<div>&lt;div&gt;<div><div></div>');
    });

    it('should correctly enumerate a non-plain object', async () => {
      await renderToString(ELEMENT_FIXTURE_WITH_COMPLEX_PROPS)
        .should.eventually.equal('<div a="1" b="2"></div>');
    });

    it('should handle props spread', async () => {
      const props = { foo: 'bar', xyz: 'abc' };
      await renderToString(html`<div ...${props} />`)
        .should.eventually.equal('<div foo="bar" xyz="abc"></div>');
    });

    it('should handle unquoted props', async () => {
      await renderToString(html`<div foo=bar />`)
        .should.eventually.equal('<div foo="bar"></div>');
    });

    it('should ignore unsupported property types', async () => {
      const consoleErrorStub = sinon.stub(console, 'error');

      // @ts-ignore
      // eslint-disable-next-line unicorn/no-null
      await renderToString(html`<div foo="${() => {}}" bar="${null}" abc="${undefined}" xyz="${{}}"></div>`)
        .should.eventually.equal('<div></div>');

      consoleErrorStub.should.have.been
        .calledTwice
        .calledWithExactly('Unexpected prop value type:', 'function').and
        .calledWithExactly('Unexpected prop value type:', 'object');
    });
  });
});
