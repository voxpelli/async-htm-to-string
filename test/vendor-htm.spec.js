/**
 * Tests for the htm-improved module (@voxpelli/htm-improved).
 *
 * These tests are ported from the upstream htm repository:
 * https://github.com/developit/htm/blob/master/test/index.test.mjs
 * https://github.com/developit/htm/blob/master/test/statics-caching.test.mjs
 *
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0
 */

/// <reference types="node" />
/// <reference types="mocha" />
/// <reference types="chai" />

'use strict';

const chai = require('chai');

chai.should();
const { expect } = chai;

const htm = require('@voxpelli/htm-improved');

/** @import { HFunction } from '@voxpelli/htm-improved' */

/**
 * Simple h function for testing that returns a plain object.
 * Note: props is null (not undefined) when no props are provided,
 * matching React/Preact convention.
 *
 * @type {HFunction<{ tag: unknown, props: Record<string, unknown> | null, children: unknown[] }>}
 */
const h = (tag, props, ...children) => ({ tag, props, children });

const html = htm.bind(h);

/**
 * H function that returns `this`.
 *
 * @this {unknown[]}
 * @returns {unknown[]}
 */
const thisReturner = function () {
  return this;
};

/**
 * H function that returns `this[0]` (staticness bits).
 *
 * @this {unknown[]}
 * @returns {unknown}
 */
const bitReturner = function () {
  return this[0];
};

/**
 * Wrap an h function to allow forcing subtrees to be static.
 *
 * @param {HFunction<{ tag: unknown, props: Record<string, unknown> | null, children: unknown[] }>} originalH - The original h function
 * @returns {HFunction<unknown>} The wrapped h function
 */
const wrapH = (originalH) => {
  /**
   * @this {[number, ...unknown[]]}
   * @param {unknown} type
   * @param {Record<string, unknown> | null} props
   * @param {...unknown} children
   * @returns {unknown}
   */
  const wrapped = function (type, props, ...children) {
    if (type === '@static') {
      this[0] &= ~3;
      return children;
    }
    if (props && props['@static']) {
      this[0] &= ~3;
    }
    return originalH(type, props, ...children);
  };
  return wrapped;
};

// Placeholder component for tests
const FooComponent = () => {};
const onClickHandler = () => {};
const MyComponent = () => {};

// =============================================================================
// Tests ported from upstream htm/test/index.test.mjs
// =============================================================================

describe('@voxpelli/htm-improved', () => {
  describe('basic parsing', () => {
    it('should return undefined for empty template', () => {
      expect(html``).to.equal(undefined);
    });

    it('should parse single named elements', () => {
      expect(html`<div />`).to.deep.equal({ tag: 'div', props: null, children: [] });
      expect(html`<div/>`).to.deep.equal({ tag: 'div', props: null, children: [] });
      expect(html`<span />`).to.deep.equal({ tag: 'span', props: null, children: [] });
    });

    it('should parse multiple root elements', () => {
      expect(html`<a /><b></b><c><//>`).to.deep.equal([
        { tag: 'a', props: null, children: [] },
        { tag: 'b', props: null, children: [] },
        { tag: 'c', props: null, children: [] },
      ]);
    });

    it('should parse single dynamic tag name', () => {
      expect(html`<${'foo'} />`).to.deep.equal({ tag: 'foo', props: null, children: [] });
      expect(html`<${FooComponent} />`).to.deep.equal({ tag: FooComponent, props: null, children: [] });
    });
  });

  describe('props', () => {
    it('should parse single boolean prop', () => {
      expect(html`<a disabled />`).to.deep.equal({ tag: 'a', props: { disabled: true }, children: [] });
    });

    it('should parse two boolean props', () => {
      expect(html`<a invisible disabled />`).to.deep.equal({ tag: 'a', props: { invisible: true, disabled: true }, children: [] });
    });

    it('should parse single prop with empty value', () => {
      expect(html`<a href="" />`).to.deep.equal({ tag: 'a', props: { href: '' }, children: [] });
    });

    it('should parse two props with empty values', () => {
      expect(html`<a href="" foo="" />`).to.deep.equal({ tag: 'a', props: { href: '', foo: '' }, children: [] });
    });

    it('should parse single prop with empty name', () => {
      expect(html`<a ""="foo" />`).to.deep.equal({ tag: 'a', props: { '': 'foo' }, children: [] });
    });

    it('should parse single prop with static value', () => {
      expect(html`<a href="/hello" />`).to.deep.equal({ tag: 'a', props: { href: '/hello' }, children: [] });
    });

    it('should parse single prop with static value followed by boolean prop', () => {
      expect(html`<a href="/hello" b />`).to.deep.equal({ tag: 'a', props: { href: '/hello', b: true }, children: [] });
    });

    it('should parse two props with static values', () => {
      expect(html`<a href="/hello" target="_blank" />`).to.deep.equal({ tag: 'a', props: { href: '/hello', target: '_blank' }, children: [] });
    });

    it('should parse single prop with dynamic value', () => {
      expect(html`<a href=${'foo'} />`).to.deep.equal({ tag: 'a', props: { href: 'foo' }, children: [] });
    });

    it('should handle slash in middle of tag name or property name', () => {
      expect(html`<ab/ba prop=value>`).to.deep.equal({ tag: 'ab', props: null, children: [] });
      expect(html`<abba pr/op=value>`).to.deep.equal({ tag: 'abba', props: { pr: true }, children: [] });
    });

    it('should handle slash in property value', () => {
      expect(html`<abba prop=val/ue><//>`).to.deep.equal({ tag: 'abba', props: { prop: 'val/ue' }, children: [] });
      expect(html`<abba prop=value/>`).to.deep.equal({ tag: 'abba', props: { prop: 'value' }, children: [] });
      expect(html`<abba prop=value/ ><//>`).to.deep.equal({ tag: 'abba', props: { prop: 'value/' }, children: [] });
    });

    it('should parse two props with dynamic values', () => {
      expect(html`<a href=${'foo'} onClick=${onClickHandler} />`).to.deep.equal({ tag: 'a', props: { href: 'foo', onClick: onClickHandler }, children: [] });
    });

    it('should concatenate multiple static and dynamic values', () => {
      expect(html`<a href="before${'foo'}after" />`).to.deep.equal({ tag: 'a', props: { href: 'beforefooafter' }, children: [] });
      expect(html`<a href=${1}${1} />`).to.deep.equal({ tag: 'a', props: { href: '11' }, children: [] });
      expect(html`<a href=${1}between${1} />`).to.deep.equal({ tag: 'a', props: { href: '1between1' }, children: [] });
      expect(html`<a href=/before/${'foo'}/after />`).to.deep.equal({ tag: 'a', props: { href: '/before/foo/after' }, children: [] });
      expect(html`<a href=/before/${'foo'}/>`).to.deep.equal({ tag: 'a', props: { href: '/before/foo' }, children: [] });
    });
  });

  describe('spread props', () => {
    it('should spread props', () => {
      expect(html`<a ...${{ foo: 'bar' }} />`).to.deep.equal({ tag: 'a', props: { foo: 'bar' }, children: [] });
      expect(html`<a b ...${{ foo: 'bar' }} />`).to.deep.equal({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
      expect(html`<a b c ...${{ foo: 'bar' }} />`).to.deep.equal({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
      expect(html`<a ...${{ foo: 'bar' }} b />`).to.deep.equal({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
      expect(html`<a b="1" ...${{ foo: 'bar' }} />`).to.deep.equal({ tag: 'a', props: { b: '1', foo: 'bar' }, children: [] });
      expect(html`<a x="1"><b y="2" ...${{ c: 'bar' }}/></a>`).to.deep.equal(h('a', { x: '1' }, h('b', { y: '2', c: 'bar' })));
      expect(html`<a b=${2} ...${{ c: 3 }}>d: ${4}</a>`).to.deep.equal(h('a', { b: 2, c: 3 }, 'd: ', 4));
      expect(html`<a ...${{ c: 'bar' }}><b ...${{ d: 'baz' }}/></a>`).to.deep.equal(h('a', { c: 'bar' }, h('b', { d: 'baz' })));
    });

    it('should handle multiple spread props in one element', () => {
      expect(html`<a ...${{ foo: 'bar' }} ...${{ quux: 'baz' }} />`).to.deep.equal({ tag: 'a', props: { foo: 'bar', quux: 'baz' }, children: [] });
    });

    it('should handle mixed spread and static props', () => {
      expect(html`<a b ...${{ foo: 'bar' }} />`).to.deep.equal({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
      expect(html`<a b c ...${{ foo: 'bar' }} />`).to.deep.equal({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
      expect(html`<a ...${{ foo: 'bar' }} b />`).to.deep.equal({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
      expect(html`<a ...${{ foo: 'bar' }} b c />`).to.deep.equal({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
    });

    it('should not mutate spread variables', () => {
      const obj = {};
      html`<a ...${obj} b="1" />`;
      expect(obj).to.deep.equal({});
    });
  });

  describe('closing tags', () => {
    it('should parse closing tag', () => {
      expect(html`<a></a>`).to.deep.equal({ tag: 'a', props: null, children: [] });
      expect(html`<a b></a>`).to.deep.equal({ tag: 'a', props: { b: true }, children: [] });
    });

    it('should parse auto-closing tag', () => {
      expect(html`<a><//>`).to.deep.equal({ tag: 'a', props: null, children: [] });
    });
  });

  describe('non-element roots', () => {
    it('should return non-element roots directly', () => {
      expect(html`foo`).to.equal('foo');
      expect(html`${1}`).to.equal(1);
      expect(html`foo${1}`).to.deep.equal(['foo', 1]);
      expect(html`foo${1}bar`).to.deep.equal(['foo', 1, 'bar']);
    });
  });

  describe('children', () => {
    it('should parse text child', () => {
      expect(html`<a>foo</a>`).to.deep.equal({ tag: 'a', props: null, children: ['foo'] });
      expect(html`<a>foo bar</a>`).to.deep.equal({ tag: 'a', props: null, children: ['foo bar'] });
      expect(html`<a>foo "<b /></a>`).to.deep.equal({ tag: 'a', props: null, children: ['foo "', { tag: 'b', props: null, children: [] }] });
    });

    it('should parse dynamic child', () => {
      expect(html`<a>${'foo'}</a>`).to.deep.equal({ tag: 'a', props: null, children: ['foo'] });
    });

    it('should parse mixed text and dynamic children', () => {
      expect(html`<a>${'foo'}bar</a>`).to.deep.equal({ tag: 'a', props: null, children: ['foo', 'bar'] });
      expect(html`<a>before${'foo'}after</a>`).to.deep.equal({ tag: 'a', props: null, children: ['before', 'foo', 'after'] });
      // Note: Original test uses null, we use undefined due to unicorn/no-null

      expect(html`<a>foo${null}</a>`).to.deep.equal({ tag: 'a', props: null, children: ['foo', null] });
    });

    it('should parse element child', () => {
      expect(html`<a><b /></a>`).to.deep.equal(h('a', null, h('b', null)));
    });

    it('should parse multiple element children', () => {
      expect(html`<a><b /><c /></a>`).to.deep.equal(h('a', null, h('b', null), h('c', null)));
      expect(html`<a x><b y /><c z /></a>`).to.deep.equal(h('a', { x: true }, h('b', { y: true }), h('c', { z: true })));
      expect(html`<a x=1><b y=2 /><c z=3 /></a>`).to.deep.equal(h('a', { x: '1' }, h('b', { y: '2' }), h('c', { z: '3' })));
      expect(html`<a x=${1}><b y=${2} /><c z=${3} /></a>`).to.deep.equal(h('a', { x: 1 }, h('b', { y: 2 }), h('c', { z: 3 })));
    });

    it('should parse mixed typed children', () => {
      expect(html`<a>foo<b /></a>`).to.deep.equal(h('a', null, 'foo', h('b', null)));

      expect(html`<a><b />bar</a>`).to.deep.equal(h('a', null, h('b', null), 'bar'));

      expect(html`<a>before<b />after</a>`).to.deep.equal(h('a', null, 'before', h('b', null), 'after'));

      expect(html`<a>before<b x=1 />after</a>`).to.deep.equal(h('a', null, 'before', h('b', { x: '1' }), 'after'));

      expect(
        html`
          <a>
            before
            ${'foo'}
            <b />
            ${'bar'}
            after
          </a>
        `

      ).to.deep.equal(h('a', null, 'before', 'foo', h('b', null), 'bar', 'after'));
    });
  });

  describe('special characters', () => {
    it('should allow hyphens in attribute names', () => {
      expect(html`<a b-c></a>`).to.deep.equal(h('a', { 'b-c': true }));
    });

    it('should allow NUL characters in attribute values', () => {
      expect(html`<a b="\0"></a>`).to.deep.equal(h('a', { b: '\0' }));
      expect(html`<a b="\0" c=${'foo'}></a>`).to.deep.equal(h('a', { b: '\0', c: 'foo' }));
    });

    it('should allow NUL characters in text', () => {
      expect(html`<a>\0</a>`).to.deep.equal(h('a', null, '\0'));

      expect(html`<a>\0${'foo'}</a>`).to.deep.equal(h('a', null, '\0', 'foo'));
    });
  });

  describe('cache key uniqueness', () => {
    it('should have unique cache keys', () => {
      html`<a b="${'foo'}" />`;
      expect(html`<a b="\0" />`).to.deep.equal(h('a', { b: '\0' }));
      expect(html`<a>${''}9aaaaaaaaa${''}</a>`).to.not.deep.equal(html`<a>${''}0${''}aaaaaaaaa${''}</a>`);
      expect(html`<a>${''}0${''}aaaaaaaa${''}</a>`).to.not.deep.equal(html`<a>${''}.8aaaaaaaa${''}</a>`);
    });
  });

  describe('HTML comments', () => {
    it('should ignore HTML comments', () => {
      expect(html`<a><!-- Hello, world! --></a>`).to.deep.equal(h('a', null));

      expect(html`<a><!-- Hello,\nworld! --></a>`).to.deep.equal(h('a', null));

      expect(html`<a><!-- ${'Hello, world!'} --></a>`).to.deep.equal(h('a', null));

      expect(html`<a><!--> Hello, world <!--></a>`).to.deep.equal(h('a', null));
    });
  });
});

// =============================================================================
// Tests ported from upstream htm/test/statics-caching.test.mjs
// =============================================================================

describe('vendored htm statics caching', () => {
  describe('template caching', () => {
    it('should cache static subtrees', () => {
      // eslint-disable-next-line unicorn/consistent-function-scoping -- tests caching behavior
      const x = () => html`<div>a</div>`;
      const a = x();
      const b = x();
      expect(a).to.deep.equal({ tag: 'div', props: null, children: ['a'] });
      expect(b).to.deep.equal({ tag: 'div', props: null, children: ['a'] });
      expect(a).to.equal(b); // Same reference due to caching
    });

    it('should have a different cache for each h function', () => {
      let tmp = htm.bind(() => 1);

      const x = () => tmp`<div>a</div>`;
      const a = x();
      tmp = htm.bind(() => 2);
      const b = x();

      expect(a).to.equal(1);
      expect(b).to.equal(2);
    });
  });

  describe('`this` in the h function', () => {
    it('should stay the same for each call site', () => {
      const htmlThis = htm.bind(thisReturner);

      const x = () => htmlThis`<div>a</div>`;
      const a = x();
      const b = x();
      expect(a).to.equal(b);
    });

    it('should be different for each call site', () => {
      const htmlThis = htm.bind(thisReturner);
      const a = htmlThis`<div>a</div>`;
      const b = htmlThis`<div>a</div>`;
      expect(a).to.not.equal(b);
    });

    it('should be specific to each h function', () => {
      /**
       * @this {unknown[]}
       * @returns {unknown[]}
       */
      // eslint-disable-next-line unicorn/consistent-function-scoping -- tests caching behavior
      const thisReturner2 = function () { return this; };
      /**
       * @this {unknown[]}
       * @returns {unknown[]}
       */
      // eslint-disable-next-line unicorn/consistent-function-scoping -- tests caching behavior
      const thisReturner3 = function () { return this; };

      let tmp = htm.bind(thisReturner2);

      const x = () => tmp`<div>a</div>`;
      const a = x();
      tmp = htm.bind(thisReturner3);
      const b = x();
      expect(a).to.not.equal(b);
    });
  });

  describe('`this[0]` staticness bits', () => {
    it('should be 0 for static subtrees', () => {
      const htmlBits = htm.bind(bitReturner);
      expect(htmlBits`<div></div>`).to.equal(0);
      expect(htmlBits`<div>a</div>`).to.equal(0);
      expect(htmlBits`<div><a /></div>`).to.equal(0);
    });

    it('should be 2 for static nodes with some dynamic children', () => {
      const htmlBits = htm.bind(bitReturner);
      expect(htmlBits`<div>${'a'}<b /></div>`).to.equal(2);
      expect(htmlBits`<div><a y=${2} /><b /></div>`).to.equal(2);
    });

    it('should be 1 for dynamic nodes with all static children', () => {
      const htmlBits = htm.bind(bitReturner);
      expect(htmlBits`<div x=${1}><a /><b /></div>`).to.equal(1);
    });

    it('should be 3 for dynamic nodes with some dynamic children', () => {
      const htmlBits = htm.bind(bitReturner);
      expect(htmlBits`<div x=${1}><a y=${2} /><b /></div>`).to.equal(3);
    });
  });

  describe('h function modifying `this[0]`', () => {
    it('should be able to force subtrees to be static via a prop', () => {
      const htmlWrapped = htm.bind(wrapH(h));
      const x = () => htmlWrapped`<div @static>${'a'}</div>`;
      const a = x();
      const b = x();
      expect(a).to.deep.equal({ tag: 'div', props: { '@static': true }, children: ['a'] });
      expect(b).to.deep.equal({ tag: 'div', props: { '@static': true }, children: ['a'] });
      expect(a).to.equal(b);
    });

    it('should be able to force subtrees to be static via a special tag', () => {
      const htmlWrapped = htm.bind(wrapH(h));
      const x = () => htmlWrapped`<@static>${'a'}<//>`;
      const a = x();
      const b = x();
      expect(a).to.deep.equal(['a']);
      expect(b).to.deep.equal(['a']);
      expect(a).to.equal(b);
    });
  });
});

// =============================================================================
// Additional tests specific to our vendored version
// =============================================================================

describe('vendored htm security', () => {
  describe('trimNewlineWhitespace (ReDoS fix)', () => {
    it('should handle pathological whitespace inputs efficiently', () => {
      // This input would cause exponential backtracking with the original regex
      const pathological = ' '.repeat(10000) + '\n';
      const start = Date.now();

      // Just calling html with this shouldn't hang
      const result = html`<a>${pathological}test</a>`;
      const elapsed = Date.now() - start;

      expect(result).to.deep.equal({ tag: 'a', props: null, children: [pathological, 'test'] });
      // Should complete in well under a second (the original regex could take minutes)
      expect(elapsed).to.be.lessThan(100);
    });

    it('should trim whitespace containing newlines correctly', () => {
      // Leading whitespace with newline
      expect(html`
        <a>
          foo</a>
      `).to.deep.equal({ tag: 'a', props: null, children: ['foo'] });

      // Trailing whitespace with newline
      expect(html`
        <a>foo
        </a>
      `).to.deep.equal({ tag: 'a', props: null, children: ['foo'] });

      // Both leading and trailing
      expect(html`
        <a>
          foo
        </a>
      `).to.deep.equal({ tag: 'a', props: null, children: ['foo'] });
    });

    it('should preserve whitespace without newlines', () => {
      // Just spaces - no newline, so preserved
      expect(html`<a>   foo   </a>`).to.deep.equal({ tag: 'a', props: null, children: ['   foo   '] });
    });
  });
});

describe('vendored htm type compatibility', () => {
  describe('h function receives correct types', () => {
    it('should pass null for props when no props exist', () => {
      /** @type {unknown} */
      let receivedProps;
      const customHtml = htm.bind((type, props) => {
        receivedProps = props;
        return { type, props };
      });

      customHtml`<div />`;
      expect(receivedProps).to.equal(null);
    });

    it('should pass object for props when props exist', () => {
      /** @type {unknown} */
      let receivedProps;
      const customHtml = htm.bind((type, props) => {
        receivedProps = props;
        return { type, props };
      });

      customHtml`<div foo="bar" />`;
      expect(receivedProps).to.deep.equal({ foo: 'bar' });
    });

    it('should pass string tag names correctly', () => {
      /** @type {unknown} */
      let receivedType;
      const customHtml = htm.bind((type) => {
        receivedType = type;
        return type;
      });

      customHtml`<custom-element />`;
      expect(receivedType).to.equal('custom-element');
    });

    it('should pass function tag names correctly', () => {
      /** @type {unknown} */
      let receivedType;
      const customHtml = htm.bind((type) => {
        receivedType = type;
        return type;
      });

      customHtml`<${MyComponent} />`;
      expect(receivedType).to.equal(MyComponent);
    });
  });
});
