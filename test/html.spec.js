import { describe, it } from 'node:test';
import assert from 'node:assert';

import { html } from '../index.js';
import { ELEMENT_ARRAY_CHILD_FIXTURE, ELEMENT_FIXTURE } from './fixtures.js';

describe('html``', () => {
  it('should handle complex example', () => {
    /** @type {import('..').SimpleRenderableElementFunction} */
    const abc = (_props, children) => html`<cool>${children}</cool>`;
    /** @type {import('..').SimpleRenderableElementFunction} */
    const bar = (_props, children) => html`<wowzors class="wow"><${abc}>${children}<//></wowzors>`;

    /** @type {import('..').HtmlMethodResult} */
    const fixture = {
      type: 'div',
      props: { 'class': 'prop1 prop2', 'data-foo': '123' },
      children: [
        '  ',
        { type: 'img', props: { src: '#' }, children: [] },
        ' ',
        {
          type: bar,
          props: {},
          children: [
            '    ',
            {
              type: 'woot',
              props: {},
              children: ['YEA&H!', '<div>w0000000000t</div>'],
            },
          ],
        },
      ],
    };

    const foo = 'woot';
    const danger = '<div>w0000000000t</div>';

    const result = html`<div class="${['prop1', 'prop2'].join(' ')}" data-foo="123">  <img src="#" /> <${bar}>    <${foo}>YEA&H!${danger}</${foo}></${bar}></div>`;

    assert.ok(result);
    assert.deepStrictEqual(result, fixture);
  });

  it('should handle array content', () => {
    const list = [
      html`<li>One</li>`,
      html`<li>Two</li>`,
    ].flat();
    const result = html`<ul>${list}</ul>`;
    assert.ok(result);
    assert.deepStrictEqual(result, ELEMENT_ARRAY_CHILD_FIXTURE);
  });

  it('should handle simple root example', () => {
    const result = html`<div />`;
    assert.ok(result);
    assert.deepStrictEqual(result, ELEMENT_FIXTURE);
  });

  it('should handle multi root example', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture = [
      { type: 'div', props: {}, children: [] },
      { type: 'div', props: {}, children: [] },
    ];

    assert.deepStrictEqual(html`<div /><div />`, fixture);
  });

  it('should handle text root example', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture = 'foo';
    assert.strictEqual(html`foo`, fixture);
  });

  it('should handle combined root example', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture = [
      { type: 'div', props: {}, children: [] },
      'foo',
    ];
    assert.deepStrictEqual(html`<div />foo`, fixture);
  });

  it('should handle multi text root example', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture = ['foo', 'bar'];
    assert.deepStrictEqual(html`${'foo'}bar`, fixture);
  });

  it('should handle number root value', () => {
    assert.strictEqual(html`${123}`, '123');
  });

  it('should handle undefined root example', () => {
    assert.strictEqual(html`${undefined}`, '');
  });

  it('should handle null root example', () => {
    // eslint-disable-next-line unicorn/no-null
    assert.strictEqual(html`${null}`, '');
  });

  it('should handle false root example', () => {
    assert.strictEqual(html`${false}`, '');
  });

  it('should handle 0 root example', () => {
    assert.strictEqual(html`${0}`, '0');
  });

  it('should handle top level array content', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture1 = [
      { type: 'div', props: {}, children: [] },
      { type: 'div', props: {}, children: [] },
    ];

    /** @type {import('..').HtmlMethodResult} */
    const fixture2 = [
      ...fixture1,
      { type: 'span', props: {}, children: [] },
    ];

    assert.deepStrictEqual(html`${fixture1}<span />`, fixture2);
  });

  it('should throw on invalid root type', () => {
    assert.throws(() => { html`${true}`; }, { name: 'TypeError', message: 'Resolved to invalid value type: boolean' });
    assert.throws(() => { html`${{}}`; }, { name: 'TypeError', message: 'Resolved to invalid type of object value "type" property: undefined' });
    assert.throws(() => { html`${Symbol.asyncIterator}`; }, { name: 'TypeError', message: 'Resolved to invalid value type: symbol' });
    assert.throws(() => { html`${() => {}}`; }, { name: 'TypeError', message: 'Resolved to invalid value type: function' });
    assert.throws(() => { html`${[Symbol.asyncIterator, 'foo']}`; }, { name: 'TypeError', message: 'Resolved to invalid value type: symbol' });
  });

  it('should throw on promise resolving to array nested', async () => {
    await assert.rejects(
      () => html`${Promise.resolve(['a', 'b'])}`,
      { name: 'TypeError', message: 'Unexpected nested array value found' }
    );
  });

  it('should throw on multi root type', () => {
    assert.throws(() => { html`foo${true}`; }, { name: 'TypeError', message: 'Resolved to invalid value type: boolean' });
    assert.throws(() => { html`foo${Symbol.asyncIterator}`; }, { name: 'TypeError', message: 'Resolved to invalid value type: symbol' });
    assert.throws(() => { html`foo${() => {}}`; }, { name: 'TypeError', message: 'Resolved to invalid value type: function' });
  });
});
