/**
 * Type definitions for @voxpelli/htm-improved
 * https://github.com/voxpelli/async-htm-to-string/tree/main/packages/htm-improved
 *
 * Based on the original htm type definitions.
 * Original work Copyright 2018 Google Inc.
 * Modifications Copyright 2026 Pelle Wessman
 *
 * Licensed under the Apache License, Version 2.0
 * See ./LICENSE for full license text
 *
 * These types provide type safety when using htm.
 * They are intentionally more permissive than ideal to match htm's runtime
 * behavior, which accepts any value as the type parameter.
 */

/**
 * A hyperscript-style function that creates virtual DOM elements.
 *
 * Note: The `type` parameter is `unknown` because htm allows:
 * - String tag names: 'div', 'span', etc.
 * - Component functions: (props, children) => element
 * - Any interpolated value: ${someVariable}
 *
 * The `props` parameter uses `null` (not `undefined`) for "no props" to match
 * the convention used by React's createElement, Preact's h, and other
 * hyperscript implementations. This is the original htm behavior.
 *
 * @template Result - The return type of the hyperscript function
 */
type HFunction<Result = unknown> = (
  type: unknown,
  props: Record<string, unknown> | null,
  ...children: unknown[]
) => Result;

/**
 * A tagged template function returned by htm.bind().
 *
 * @template Result - The return type matching the bound h function
 */
type BoundHtm<Result = unknown> = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Result | Result[];

/**
 * The htm module interface with the bind method.
 */
interface Htm {
  /**
   * Bind htm to a hyperscript function.
   *
   * @template Result - The return type of the hyperscript function
   * @param h - The hyperscript function to bind
   * @returns A tagged template function that parses HTM syntax
   * @example
   * ```javascript
   * const h = (type, props, ...children) => ({ type, props, children });
   * const html = htm.bind(h);
   * const element = html`<div class="foo">Hello</div>`;
   * ```
   */
  bind<Result>(h: HFunction<Result>): BoundHtm<Result>;
}

/**
 * Internal type representing the built instruction list from parsing.
 * This is an opaque type used internally by htm.
 */
type BuiltTemplate = unknown[];

declare const htm: Htm;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- Merging namespace with const is standard for CJS exports
declare namespace htm {
  export type { HFunction, BoundHtm, BuiltTemplate, Htm };
}

export = htm;
