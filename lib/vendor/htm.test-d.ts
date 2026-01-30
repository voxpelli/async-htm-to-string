/**
 * Type tests for vendored htm module.
 *
 * Run with: npx tsd
 */

import { expectType, expectAssignable } from 'tsd';
import type { HFunction, BoundHtm, BuiltTemplate, Htm } from './htm-types.d.ts';

// Import the actual module for runtime type checking
import htm from './htm.js';

// ============================================================================
// Test: htm.bind() basic usage
// ============================================================================

// Simple h function that accepts unknown type (matching htm's behavior)
const simpleH: HFunction<{ type: unknown; props: Record<string, unknown>; children: unknown[] }> = (
  type,
  props,
  ...children
) => ({
  type,
  props: props || {},
  children,
});

// Bind returns a tagged template function
const html = htm.bind(simpleH);
expectType<BoundHtm<{ type: unknown; props: Record<string, unknown>; children: unknown[] }>>(html);

// ============================================================================
// Test: BoundHtm return types
// ============================================================================

type SimpleElement = { type: unknown; props: Record<string, unknown>; children: unknown[] };

// Single element returns single result or array
const singleElement = html`<div />`;
expectAssignable<SimpleElement | SimpleElement[]>(singleElement);

// Multiple elements may return array
const multipleElements = html`<div /><span />`;
expectAssignable<SimpleElement | SimpleElement[]>(multipleElements);

// ============================================================================
// Test: HFunction type
// ============================================================================

// HFunction with default generics
const defaultH: HFunction = (type, props, ...children) => ({ type, props, children });
expectType<unknown>(defaultH('div', {}));
expectType<unknown>(defaultH('div', { 'class': 'foo' }));
expectType<unknown>(defaultH('div', { 'class': 'foo' }, 'child1', 'child2'));

// HFunction with specific result type
interface VNode {
  tag: unknown;
  attributes: Record<string, unknown>;
  kids: unknown[];
}

const typedH: HFunction<VNode> = (type, props, ...children) => ({
  tag: type,
  attributes: props || {},
  kids: children,
});

expectType<VNode>(typedH('div', {}));
expectType<VNode>(typedH('div', { id: 'test' }, 'hello'));

// ============================================================================
// Test: htm.bind() with typed h function
// ============================================================================

const typedHtml = htm.bind(typedH);

// Result should be VNode or VNode[]
const typedResult = typedHtml`<div id="test">Hello</div>`;
expectAssignable<VNode | VNode[]>(typedResult);

// ============================================================================
// Test: Template literal interpolation types
// ============================================================================

// String interpolation
const withString = html`<div class=${'foo'} />`;
expectAssignable<SimpleElement | SimpleElement[]>(withString);

// Number interpolation
const withNumber = html`<div count=${42} />`;
expectAssignable<SimpleElement | SimpleElement[]>(withNumber);

// Boolean interpolation
const withBoolean = html`<div disabled=${true} />`;
expectAssignable<SimpleElement | SimpleElement[]>(withBoolean);

// Object interpolation (spread)
const props = { 'class': 'foo', id: 'bar' };
const withSpread = html`<div ...${props} />`;
expectAssignable<SimpleElement | SimpleElement[]>(withSpread);

// Child interpolation
const withChild = html`<div>${'text content'}</div>`;
expectAssignable<SimpleElement | SimpleElement[]>(withChild);

// Array child interpolation
const items = ['a', 'b', 'c'];
const withArrayChild = html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`;
expectAssignable<SimpleElement | SimpleElement[]>(withArrayChild);

// ============================================================================
// Test: Component (function) as type
// ============================================================================

// Component function
const MyComponent: HFunction<SimpleElement> = (type, props, ...children) => ({
  type: 'custom',
  props: { ...props, originalType: type },
  children,
});

// Using component in template (type is unknown so anything goes)
const withComponent = html`<${MyComponent} foo="bar">content</${MyComponent}>`;
expectAssignable<SimpleElement | SimpleElement[]>(withComponent);

// ============================================================================
// Test: Dynamic tag names
// ============================================================================

const tagName = 'section';
const dynamicTag = html`<${tagName}>content</${tagName}>`;
expectAssignable<SimpleElement | SimpleElement[]>(dynamicTag);

// ============================================================================
// Test: BuiltTemplate is opaque
// ============================================================================

// BuiltTemplate should be assignable from unknown[]
const template: BuiltTemplate = [0, 1, 2, 'test'];
expectType<BuiltTemplate>(template);

// ============================================================================
// Test: Htm interface
// ============================================================================

// htm should conform to Htm interface
expectAssignable<Htm>(htm);

// htm.bind should be a function
expectType<Htm['bind']>(htm.bind);

// ============================================================================
// Test: Fragments and text content
// ============================================================================

// Empty fragment
const emptyFragment = html`<></>`;
expectAssignable<SimpleElement | SimpleElement[] | undefined>(emptyFragment);

// Text only
const textOnly = html`Hello World`;
expectAssignable<SimpleElement | SimpleElement[] | string>(textOnly);

// Mixed content
const mixedContent = html`<div />Text<span />`;
expectAssignable<SimpleElement | SimpleElement[]>(mixedContent);

// ============================================================================
// Test: Nested elements
// ============================================================================

const nested = html`
  <div class="outer">
    <div class="inner">
      <span>Deep</span>
    </div>
  </div>
`;
expectAssignable<SimpleElement | SimpleElement[]>(nested);

// ============================================================================
// Test: Self-closing tags
// ============================================================================

const selfClosing = html`<input type="text" /><br /><img src="test.png" />`;
expectAssignable<SimpleElement | SimpleElement[]>(selfClosing);

// ============================================================================
// Test: Boolean attributes
// ============================================================================

const booleanAttrs = html`<input disabled checked readonly />`;
expectAssignable<SimpleElement | SimpleElement[]>(booleanAttrs);

// ============================================================================
// Test: Spread attributes
// ============================================================================

const spreadProps = { id: 'test', 'class': 'foo', 'data-value': 123 };
const withSpreadAttrs = html`<div ...${spreadProps}>Content</div>`;
expectAssignable<SimpleElement | SimpleElement[]>(withSpreadAttrs);

// ============================================================================
// Test: Comments are ignored
// ============================================================================

const withComment = html`<div><!-- comment --></div>`;
expectAssignable<SimpleElement | SimpleElement[]>(withComment);
