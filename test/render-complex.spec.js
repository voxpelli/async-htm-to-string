import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert';

import { html, rawHtml, renderToString } from '../index.js';
import { ELEMENT_FIXTURE_INVALID_TYPE, ELEMENT_FIXTURE_WITH_COMPLEX_PROPS } from './fixtures.js';
import { createStub, createStubReturningArg } from './helpers.js';

process.on('unhandledRejection', reason => { throw reason; });

describe('renderToString()', () => {
  afterEach(() => {
    mock.restoreAll();
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

      const result = await renderToString(wow);
      assert.strictEqual(result, '<div class="prop1 prop2" data-foo="123">  <img src="#" /> <wowzors class="wow"><cool>    <woot>YEA&amp;H!&lt;div&gt;w0000000000t&lt;/div&gt;</woot></cool></wowzors></div>');
    });

    it('should handle multiple roots', async () => {
      const result = await renderToString(html`<div /><div />`);
      assert.strictEqual(result, '<div></div><div></div>');
    });

    it('should handle plain string', async () => {
      const result = await renderToString(html`foo`);
      assert.strictEqual(result, 'foo');
    });
  });

  describe('tags', () => {
    it('should throw on invalid tag name', async () => {
      await assert.rejects(
        () => renderToString(html`<-div></-div>`),
        Error,
        'Invalid tag name: -div'
      );
    });

    it('should throw on invalid tag type', async () => {
      await assert.rejects(
        () => renderToString(ELEMENT_FIXTURE_INVALID_TYPE),
        Error,
        'Invalid element type: boolean'
      );
    });

    it('should handle string variable tag type', async () => {
      const foo = 'bar';
      const result = await renderToString(html`<${foo}></${foo}>`);
      assert.strictEqual(result, '<bar></bar>');
    });

    it('should render self-closing tags correctly', async () => {
      const result = await renderToString(html`<img src="#" />`);
      assert.strictEqual(result, '<img src="#" />');
    });

    it('should handle self-closing tag with closing tag correctly', async () => {
      const result = await renderToString(html`<img src="#"></img>`);
      assert.strictEqual(result, '<img src="#" />');
    });

    it('should be able to render a fragment example', async () => {
      const wow = html`<><div></div></>`;
      const result = await renderToString(wow);
      assert.strictEqual(result, '<div></div>');
    });

    it('should be able to handle a non-named closing tag', async () => {
      const wow = html`<div>content here<//>`;
      const result = await renderToString(wow);
      assert.strictEqual(result, '<div>content here</div>');
    });
  });

  describe('tag function', () => {
    it('should handle function tag type', async () => {
      const foo = createStub(html`<abc />`);

      const result = await renderToString(html`<${foo} />`);
      assert.strictEqual(result, '<abc></abc>');
      assert.strictEqual(foo.calls.length, 1);
      assert.deepStrictEqual(foo.calls[0], [{}, []]);
    });

    it('should handle function tag with children', async () => {
      const foo = createStubReturningArg(1);
      const wow = html`<${foo}>content here</${foo}>`;

      const result = await renderToString(wow);
      assert.strictEqual(result, 'content here');
      assert.strictEqual(foo.calls.length, 1);
      assert.deepStrictEqual(foo.calls[0], [{}, ['content here']]);
    });

    it('should handle function tag with props', async () => {
      const foo = createStub(html`<abc />`);
      const wow = html`<${foo} foo="bar" />`;

      const result = await renderToString(wow);
      assert.strictEqual(result, '<abc></abc>');
      assert.strictEqual(foo.calls.length, 1);
      assert.deepStrictEqual(foo.calls[0], [{ foo: 'bar' }, []]);
    });
  });

  describe('children', () => {
    it('should throw on invalid child type', async () => {
      await assert.rejects(
        () => renderToString(html`<div>${true}</div>`),
        Error,
        'Invalid render item type: boolean'
      );
    });

    it('should throw on invalid child object', async () => {
      await assert.rejects(
        () => renderToString(html`<div>${{ abc: 123 }}</div>`),
        Error,
        'Not an element definition. Missing type in: {"abc":123}'
      );
    });

    it('should handle undefined child', async () => {
      const result = await renderToString(html`<div>${undefined}</div>`);
      assert.strictEqual(result, '<div></div>');
    });

    it('should handle null child', async () => {
      // eslint-disable-next-line unicorn/no-null
      const result = await renderToString(html`<div>${null}</div>`);
      assert.strictEqual(result, '<div></div>');
    });

    it('should handle text variable child', async () => {
      const result = await renderToString(html`<div>${'foo'}</div>`);
      assert.strictEqual(result, '<div>foo</div>');
    });

    it('should handle text non-variable child', async () => {
      const result = await renderToString(html`<div>foo</div>`);
      assert.strictEqual(result, '<div>foo</div>');
    });

    it('should handle text combined child', async () => {
      const result = await renderToString(html`<div>${'foo'} bar</div>`);
      assert.strictEqual(result, '<div>foo bar</div>');
    });

    it('should handle number child', async () => {
      const result = await renderToString(html`<div>${1}</div>`);
      assert.strictEqual(result, '<div>1</div>');
    });

    it('should handle element child', async () => {
      const result = await renderToString(html`<div><img /></div>`);
      assert.strictEqual(result, '<div><img /></div>');
    });

    it('should custom element child', async () => {
      const foo = createStub(html`<abc />`);

      const result = await renderToString(html`<div><${foo} /></div>`);
      assert.strictEqual(result, '<div><abc></abc></div>');
    });

    it('should handle array child', async () => {
      const result = await renderToString(html`<ul>${['foo', 'bar'].flatMap(i => html`<li>${i}</li>`)}</ul>`);
      assert.strictEqual(result, '<ul><li>foo</li><li>bar</li></ul>');
    });

    it('should have comments ignored', async () => {
      const result = await renderToString(html`<div><!-- foobar --></div>`);
      assert.strictEqual(result, '<div></div>');
    });

    it('should handle output as input', async () => {
      const foo = html`<foo />`;
      const result = await renderToString(html`<div>${foo}</div>`);
      assert.strictEqual(result, '<div><foo></foo></div>');
    });
  });

  describe('properties', () => {
    it('should throw on invalid property name', async () => {
      await assert.rejects(
        () => renderToString(html`<div -cool="123"></div>`),
        Error,
        'Invalid attribute name: -cool'
      );
    });

    it('should be able to render boolean props', async () => {
      const result = await renderToString(html`<div foo="${true}" bar="${false}" abc></div>`);
      assert.strictEqual(result, '<div foo abc></div>');
    });

    it('should be able to render numeric props', async () => {
      const result = await renderToString(html`<div foo="${0}" bar="${123}" abc="${0.001}" xyz="0" cde="123"></div>`);
      assert.strictEqual(result, '<div foo="0" bar="123" abc="0.001" xyz="0" cde="123"></div>');
    });

    it('should handle empty string props', async () => {
      const result = await renderToString(html`<div foo="${''}" xyz=""></div>`);
      assert.strictEqual(result, '<div foo="" xyz=""></div>');
    });

    it('should be able to render string props', async () => {
      const result = await renderToString(html`<div foo="${'bar'}" xyz="abc"></div>`);
      assert.strictEqual(result, '<div foo="bar" xyz="abc"></div>');
    });

    it('should escape string props', async () => {
      const result = await renderToString(html`<div foo="${'"bar"'}" yay="${'<div>'}" xyz="ab&c"></div>`);
      assert.strictEqual(result, '<div foo="&quot;bar&quot;" yay="&lt;div&gt;" xyz="ab&amp;c"></div>');
    });

    it('should escape string content', async () => {
      const result = await renderToString(html`<div>${'"bar"'}${'<div>'}ab&c</div>`);
      assert.strictEqual(result, '<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>');
    });

    it('should not escape raw html given through template literal rawHtml``', async () => {
      const result = await renderToString(rawHtml`<div>${'&quot;bar&quot;'}&lt;div&gt;ab&amp;c</div>`);
      assert.strictEqual(result, '<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>');
    });

    it('should not escape raw html given through direct call to rawHtml()', async () => {
      const result = await renderToString(rawHtml('<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>'));
      assert.strictEqual(result, '<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>');
    });

    it('should support rawHtml() as child content in ordinary html', async () => {
      const result = await renderToString(html`<div>${'<div>'}${rawHtml`<div>`}${rawHtml('<div>')}</div>`);
      assert.strictEqual(result, '<div>&lt;div&gt;<div><div></div>');
    });

    it('should correctly enumerate a non-plain object', async () => {
      const result = await renderToString(ELEMENT_FIXTURE_WITH_COMPLEX_PROPS);
      assert.strictEqual(result, '<div a="1" b="2"></div>');
    });

    it('should handle props spread', async () => {
      const props = { foo: 'bar', xyz: 'abc' };
      const result = await renderToString(html`<div ...${props} />`);
      assert.strictEqual(result, '<div foo="bar" xyz="abc"></div>');
    });

    it('should handle unquoted props', async () => {
      const result = await renderToString(html`<div foo=bar />`);
      assert.strictEqual(result, '<div foo="bar"></div>');
    });

    it('should ignore unsupported property types', async () => {
      const consoleErrorMock = mock.method(console, 'error', () => {});

      // eslint-disable-next-line unicorn/no-null
      await renderToString(html`<div foo="${() => {}}" bar="${null}" abc="${undefined}" xyz="${{}}"></div>`);

      assert.strictEqual(consoleErrorMock.mock.calls.length, 2);
      assert.deepStrictEqual(consoleErrorMock.mock.calls[0]?.arguments, ['Unexpected prop value type:', 'function']);
      assert.deepStrictEqual(consoleErrorMock.mock.calls[1]?.arguments, ['Unexpected prop value type:', 'object']);

      consoleErrorMock.mock.restore();
    });
  });
});
