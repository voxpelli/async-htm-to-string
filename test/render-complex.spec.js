import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import {
  html,
  renderToString,
} from '../index.js';

import {
  ELEMENT_FIXTURE_INVALID_TYPE,
  ELEMENT_FIXTURE_WITH_COMPLEX_PROPS,
} from './fixtures.js';

describe('renderToString()', () => {
  describe('complex', () => {
    it('should be able to render a complex example', async () => {
      const foo = 'woot';
      /** @type {import('../index.js').SimpleRenderableElementFunction} */
      const abc = (_props, children) => html`<cool>${children}</cool>`;
      /** @type {import('../index.js').SimpleRenderableElementFunction} */
      const bar = (_props, children) => html`<wowzors class="wow"><${abc}>${children}<//></wowzors>`;
      const danger = '<div>w0000000000t</div>';
      const wow = html`<div class="${['prop1', 'prop2'].join(' ')}" data-foo="123">  <img src="#" /> <${bar}>    <${foo}>YEA&H!${danger}</${foo}></${bar}></div>`;

      assert.equal(
        await renderToString(wow),
        '<div class="prop1 prop2" data-foo="123">  <img src="#" /> <wowzors class="wow"><cool>    <woot>YEA&amp;H!&lt;div&gt;w0000000000t&lt;/div&gt;</woot></cool></wowzors></div>'
      );
    });

    it('should render fragment with null interpolations', async () => {
      const element = html`<div>content</div>`;
      // eslint-disable-next-line unicorn/no-null
      const result = await renderToString(html`${element}${null}${null}`);
      assert.equal(result, '<div>content</div>');
    });

    it('should render fragment with false interpolations', async () => {
      const element = html`<span>hi</span>`;
      const result = await renderToString(html`${element}${false}`);
      assert.equal(result, '<span>hi</span>');
    });

    it('should render fragment with undefined interpolations', async () => {
      const element = html`<p>text</p>`;
      const result = await renderToString(html`${element}${undefined}`);
      assert.equal(result, '<p>text</p>');
    });

    it('should handle multiple roots', async () => {
      assert.equal(await renderToString(html`<div /><div />`), '<div></div><div></div>');
    });

    it('should handle plain string', async () => {
      assert.equal(await renderToString(html`foo`), 'foo');
    });
  });

  describe('tags', () => {
    it('should throw on invalid tag name', async () => {
      await assert.rejects(renderToString(html`<-div></-div>`), { message: 'Invalid tag name: -div' });
    });

    it('should throw on invalid tag type', async () => {
      // @ts-ignore
      await assert.rejects(renderToString(ELEMENT_FIXTURE_INVALID_TYPE), { message: 'Invalid element type: boolean' });
    });

    it('should handle string variable tag type', async () => {
      const foo = 'bar';
      assert.equal(await renderToString(html`<${foo}></${foo}>`), '<bar></bar>');
    });

    it('should render self-closing tags correctly', async () => {
      assert.equal(await renderToString(html`<img src="#" />`), '<img src="#" />');
    });

    it('should handle self-closing tag with closing tag correctly', async () => {
      assert.equal(await renderToString(html`<img src="#"></img>`), '<img src="#" />');
    });

    it('should render uppercase void elements as self-closing', async () => {
      const tag = 'IMG';
      assert.equal(await renderToString(html`<${tag} src="x" />`), '<img src="x" />');
    });

    it('should render mixed-case void elements as self-closing', async () => {
      const tag = 'Br';
      assert.equal(await renderToString(html`<${tag} />`), '<br />');
    });

    it('should be able to render a fragment example', async () => {
      const wow = html`<><div></div></>`;
      assert.equal(await renderToString(wow), '<div></div>');
    });

    it('should be able to handle a non-named closing tag', async () => {
      const wow = html`<div>content here<//>`;
      assert.equal(await renderToString(wow), '<div>content here</div>');
    });
  });

  describe('tag function', () => {
    it('should handle function tag type', async () => {
      const foo = mock.fn(/** @returns {import('../index.js').HtmlMethodResult} */ () => html`<abc />`);

      assert.equal(await renderToString(html`<${foo} />`), '<abc></abc>');

      assert.equal(foo.mock.calls.length, 1, 'should be called once');
      assert.deepEqual(foo.mock.calls[0]?.arguments, [{}, []], 'should be called with empty props and children');
    });

    it('should handle function tag with children', async () => {
      // @ts-ignore — testing runtime passthrough of children
      const foo = mock.fn(/** @type {import('../index.js').SimpleRenderableElementFunction} */ (_props, children) => children);

      assert.equal(await renderToString(html`<${foo}>content here</${foo}>`), 'content here');

      assert.equal(foo.mock.calls.length, 1, 'should be called once');
      assert.deepEqual(foo.mock.calls[0]?.arguments, [{}, ['content here']], 'should be called with children');
    });

    it('should handle function tag with props', async () => {
      const foo = mock.fn(/** @returns {import('../index.js').HtmlMethodResult} */ () => html`<abc />`);

      assert.equal(await renderToString(html`<${foo} foo="bar" />`), '<abc></abc>');

      assert.equal(foo.mock.calls.length, 1, 'should be called once');
      assert.deepEqual(foo.mock.calls[0]?.arguments, [{ foo: 'bar' }, []], 'should be called with props');
    });
  });

  describe('children', () => {
    it('should throw on invalid child type', async () => {
      await assert.rejects(renderToString(html`<div>${true}</div>`), { message: 'Invalid render item type: boolean' });
    });

    it('should throw on invalid child object', async () => {
      // @ts-ignore
      await assert.rejects(renderToString(html`<div>${{ abc: 123 }}</div>`), { message: 'Not an element definition. Missing type in: {"abc":123}' });
    });

    it('should handle undefined child', async () => {
      assert.equal(await renderToString(html`<div>${undefined}</div>`), '<div></div>');
    });

    it('should handle null child', async () => {
      // eslint-disable-next-line unicorn/no-null
      assert.equal(await renderToString(html`<div>${null}</div>`), '<div></div>');
    });

    it('should handle text variable child', async () => {
      assert.equal(await renderToString(html`<div>${'foo'}</div>`), '<div>foo</div>');
    });

    it('should handle text non-variable child', async () => {
      assert.equal(await renderToString(html`<div>foo</div>`), '<div>foo</div>');
    });

    it('should handle text combined child', async () => {
      assert.equal(await renderToString(html`<div>${'foo'} bar</div>`), '<div>foo bar</div>');
    });

    it('should handle number child', async () => {
      assert.equal(await renderToString(html`<div>${1}</div>`), '<div>1</div>');
    });

    it('should handle element child', async () => {
      assert.equal(await renderToString(html`<div><img /></div>`), '<div><img /></div>');
    });

    it('should custom element child', async () => {
      const foo = mock.fn(/** @returns {import('../index.js').HtmlMethodResult} */ () => html`<abc />`);
      assert.equal(await renderToString(html`<div><${foo} /></div>`), '<div><abc></abc></div>');
    });

    it('should handle array child', async () => {
      assert.equal(
        await renderToString(html`<ul>${['foo', 'bar'].flatMap(i => html`<li>${i}</li>`)}</ul>`),
        '<ul><li>foo</li><li>bar</li></ul>'
      );
    });

    it('should have comments ignored', async () => {
      assert.equal(await renderToString(html`<div><!-- foobar --></div>`), '<div></div>');
    });

    it('should handle output as input', async () => {
      const foo = html`<foo />`;
      assert.equal(await renderToString(html`<div>${foo}</div>`), '<div><foo></foo></div>');
    });
  });

  describe('properties', () => {
    it('should throw on invalid property name', async () => {
      await assert.rejects(renderToString(html`<div -cool="123"></div>`), { message: 'Invalid attribute name: -cool' });
    });

    it('should be able to render boolean props', async () => {
      assert.equal(await renderToString(html`<div foo="${true}" bar="${false}" abc></div>`), '<div foo abc></div>');
    });

    it('should be able to render numeric props', async () => {
      assert.equal(
        await renderToString(html`<div foo="${0}" bar="${123}" abc="${0.001}" xyz="0" cde="123"></div>`),
        '<div foo="0" bar="123" abc="0.001" xyz="0" cde="123"></div>'
      );
    });

    it('should handle empty string props', async () => {
      assert.equal(await renderToString(html`<div foo="${''}" xyz=""></div>`), '<div foo="" xyz=""></div>');
    });

    it('should be able to render string props', async () => {
      assert.equal(await renderToString(html`<div foo="${'bar'}" xyz="abc"></div>`), '<div foo="bar" xyz="abc"></div>');
    });

    it('should correctly enumerate a non-plain object', async () => {
      assert.equal(await renderToString(ELEMENT_FIXTURE_WITH_COMPLEX_PROPS), '<div a="1" b="2"></div>');
    });

    it('should handle props spread', async () => {
      const props = { foo: 'bar', xyz: 'abc' };
      assert.equal(await renderToString(html`<div ...${props} />`), '<div foo="bar" xyz="abc"></div>');
    });

    it('should handle unquoted props', async () => {
      assert.equal(await renderToString(html`<div foo=bar />`), '<div foo="bar"></div>');
    });

    it('should render NaN as string in props', async () => {
      assert.equal(await renderToString(html`<div foo="${Number.NaN}" />`), '<div foo="NaN"></div>');
    });

    it('should render Infinity as string in props', async () => {
      assert.equal(await renderToString(html`<div foo="${Number.POSITIVE_INFINITY}" />`), '<div foo="Infinity"></div>');
    });

    it('should ignore unsupported property types', async (t) => {
      const consoleErrorMock = t.mock.method(console, 'error', () => {});

      // @ts-ignore
      // eslint-disable-next-line unicorn/no-null
      assert.equal(await renderToString(html`<div foo="${() => {}}" bar="${null}" abc="${undefined}" xyz="${{}}"></div>`), '<div></div>');

      assert.equal(consoleErrorMock.mock.calls.length, 2, 'console.error should be called twice');
      assert.deepEqual(consoleErrorMock.mock.calls[0]?.arguments, ['Unexpected prop value type:', 'function']);
      assert.deepEqual(consoleErrorMock.mock.calls[1]?.arguments, ['Unexpected prop value type:', 'object']);
    });
  });
});
