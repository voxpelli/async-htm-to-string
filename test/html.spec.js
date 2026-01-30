/// <reference types="node" />
/// <reference types="mocha" />
/// <reference types="chai" />

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const should = chai.should();

const {
  html,
} = require('../lib/htm');

const {
  ELEMENT_ARRAY_CHILD_FIXTURE,
  ELEMENT_FIXTURE,
} = require('./fixtures');

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

    should.exist(result);
    result.should.deep.equal(fixture);
  });

  it('should handle array content', () => {
    const list = [
      html`<li>One</li>`,
      html`<li>Two</li>`,
    ].flat();
    const result = html`<ul>${list}</ul>`;
    should.exist(result);
    result.should.deep.equal(ELEMENT_ARRAY_CHILD_FIXTURE);
  });

  it('should handle simple root example', () => {
    const result = html`<div />`;
    should.exist(result);
    result.should.deep.equal(ELEMENT_FIXTURE);
  });

  it('should handle multi root example', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture = [
      { type: 'div', props: {}, children: [] },
      { type: 'div', props: {}, children: [] },
    ];

    html`<div /><div />`.should.deep.equal(fixture);
  });

  it('should handle text root example', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture = 'foo';
    html`foo`.should.deep.equal(fixture);
  });

  it('should handle combined root example', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture = [
      { type: 'div', props: {}, children: [] },
      'foo',
    ];
    html`<div />foo`.should.deep.equal(fixture);
  });

  it('should handle multi text root example', () => {
    /** @type {import('..').HtmlMethodResult} */
    const fixture = ['foo', 'bar'];
    html`${'foo'}bar`.should.deep.equal(fixture);
  });

  it('should handle number root value', () => { html`${123}`.should.equal('123'); });

  it('should handle undefined root example', () => { html`${undefined}`.should.equal(''); });

  // @ts-ignore
  // eslint-disable-next-line unicorn/no-null
  it('should handle null root example', () => { html`${null}`.should.equal(''); });

  it('should handle false root example', () => { html`${false}`.should.equal(''); });

  it('should handle 0 root example', () => { html`${0}`.should.equal('0'); });

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

    html`${fixture1}<span />`.should.deep.equal(fixture2);
  });

  it('should throw on invalid root type', () => {
    should.Throw(() => { html`${true}`; }, TypeError, 'Resolved to invalid value type: boolean');
    should.Throw(() => { html`${{}}`; }, TypeError, 'Resolved to invalid type of object value "type" property: undefined');
    // @ts-ignore
    should.Throw(() => { html`${Symbol.asyncIterator}`; }, TypeError, 'Resolved to invalid value type: symbol');
    // @ts-ignore
    should.Throw(() => { html`${() => {}}`; }, TypeError, 'Resolved to invalid value type: function');
    // @ts-ignore
    should.Throw(() => { html`${[Symbol.asyncIterator, 'foo']}`; }, TypeError, 'Resolved to invalid value type: symbol');
  });

  it('should throw on promise resolving to array nested', async () => {
    await html`${Promise.resolve(['a', 'b'])}`.should.be.rejectedWith(TypeError, 'Unexpected nested array value found');
  });

  it('should throw on multi root type', () => {
    should.Throw(() => { html`foo${true}`; }, TypeError, 'Resolved to invalid value type: boolean');
    // @ts-ignore
    should.Throw(() => { html`foo${Symbol.asyncIterator}`; }, TypeError, 'Resolved to invalid value type: symbol');
    // @ts-ignore
    should.Throw(() => { html`foo${() => {}}`; }, TypeError, 'Resolved to invalid value type: function');
  });
});
