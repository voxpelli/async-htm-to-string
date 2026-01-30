/**
 * Improved fork of htm with JSDoc types, security fixes, and better caching.
 *
 * Based on htm v3.1.1 - Hyperscript Tagged Markup (https://github.com/developit/htm)
 * Original work Copyright 2018 Google Inc.
 * Modifications Copyright 2026 Pelle Wessman
 * Licensed under the Apache License, Version 2.0 - See ./LICENSE for full text
 * See ./CHANGES.md for detailed list of modifications from original.
 *
 * @module @voxpelli/htm-improved
 */

'use strict';

/** @import { HFunction, BuiltTemplate, BoundHtm } from '../index.d.ts' */

// ============================================================================
// Parser Mode Constants
// ============================================================================

/**
 * Parser mode: after a closing slash, ignoring until tag ends.
 *
 * @type {0}
 */
const MODE_SLASH = 0;

/**
 * Parser mode: reading text content between tags.
 *
 * @type {1}
 */
const MODE_TEXT = 1;

/**
 * Parser mode: reading whitespace after tag name or attribute.
 *
 * @type {2}
 */
const MODE_WHITESPACE = 2;

/**
 * Parser mode: reading a tag name.
 *
 * @type {3}
 */
const MODE_TAGNAME = 3;

/**
 * Parser mode: inside an HTML comment.
 *
 * @type {4}
 */
const MODE_COMMENT = 4;

/**
 * Parser mode: setting a property value.
 *
 * @type {5}
 */
const MODE_PROP_SET = 5;

/**
 * Parser mode: appending to a property value.
 *
 * @type {6}
 */
const MODE_PROP_APPEND = 6;

// ============================================================================
// Operation Type Constants
// ============================================================================

/**
 * Operation type: append a child (static value).
 * Format: [CHILD_APPEND, fieldIndex, staticValue]
 *
 * @type {0}
 */
const CHILD_APPEND = 0;

/**
 * Operation type: recursively process a child element.
 * Format: [CHILD_RECURSE, 0, builtTemplate]
 *
 * @type {2}
 */
const CHILD_RECURSE = 2;

/**
 * Operation type: set the tag name.
 * Format: [TAG_SET, fieldIndex, staticValue]
 *
 * @type {3}
 */
const TAG_SET = 3;

/**
 * Operation type: assign props via spread.
 * Format: [PROPS_ASSIGN, fieldIndex, 0]
 *
 * @type {4}
 */
const PROPS_ASSIGN = 4;

/**
 * Operation type: set a property value.
 * Format: [PROP_SET, fieldIndex, staticValue, propName]
 *
 * @type {5}
 */
const PROP_SET = MODE_PROP_SET;

/**
 * Operation type: append to a property value.
 * Format: [PROP_APPEND, fieldIndex, staticValue, propName]
 *
 * @type {6}
 */
const PROP_APPEND = MODE_PROP_APPEND;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Evaluate a built template with the provided field values.
 *
 * This function processes the instruction list created by `build()` and
 * calls the hyperscript function `h` to create the actual elements.
 *
 * The first element of `built` (built[0]) is used as a workspace to track
 * whether the current element is "dynamic" (depends on interpolated values):
 * - Bit 0 (1): Direct dynamic value
 * - Bit 1 (2): Has dynamic descendants
 *
 * @param {HFunction} h - The hyperscript function to call for each element
 * @param {BuiltTemplate} built - The built instruction list from `build()`
 * @param {ArrayLike<unknown>} fields - The interpolated values from the template literal
 * @param {unknown[]} args - Accumulator for h() arguments. Empty for top-level, ['', null] for recursive calls
 * @returns {unknown[]} The evaluated arguments array containing element results
 */
const evaluate = (h, built, fields, args) => {
  /** @type {unknown} */
  let tmp;

  // Reset the dynamic tracking bits for this evaluation
  built[0] = 0;

  for (let i = 1; i < built.length; i++) {
    const type = /** @type {number} */ (built[i++]);

    // Get the value - either from fields (dynamic) or from built (static)
    // If dynamic, set the appropriate bit in built[0]
    const value = built[i]
      ? ((built[0] = /** @type {number} */ (built[0]) | (type ? 1 : 2)), fields[/** @type {number} */ (built[i++])])
      : built[++i];

    switch (type) {
      case TAG_SET:
        // Set the tag name (args[0])
        args[0] = /** @type {string} */ (value);
        break;

      case PROPS_ASSIGN:
        // Spread props into args[1]
        args[1] = Object.assign(args[1] || {}, value);
        break;

      case PROP_SET:
        // Set a single property
        (args[1] = /** @type {Record<string, unknown>} */ (args[1] || {}))[/** @type {string} */ (built[++i])] = value;
        break;

      case PROP_APPEND:
        // Append to an existing property (for multi-part values like class="${a} ${b}")
        /** @type {Record<string, unknown>} */ (args[1])[/** @type {string} */ (built[++i])] += String(value);
        break;

      case CHILD_RECURSE: {
        // Recursively evaluate a child element
        const childBuilt = /** @type {BuiltTemplate} */ (value);

        // Call h() with the child's evaluated args
        // The childBuilt array is passed as `this` to enable caching optimizations
        // Note: We use null (not undefined) for "no props" to match React/Preact conventions
        tmp = h.apply(
          childBuilt,
          /** @type {Parameters<HFunction>} */ (evaluate(h, childBuilt, fields, ['', null]))
        );
        args.push(tmp);

        if (childBuilt[0]) {
          // Child is dynamic - mark this element as having dynamic descendants
          built[0] = /** @type {number} */ (built[0]) | 2;
        } else {
          // Child is static - optimize by replacing CHILD_RECURSE with CHILD_APPEND
          // This caches the result for future evaluations with the same template
          built[i - 2] = CHILD_APPEND;
          built[i] = tmp;
        }
        break;
      }

      default:
        // CHILD_APPEND (0) - push static or previously-computed child
        args.push(value);
    }
  }

  return args;
};

/**
 * Trim leading and trailing whitespace that contains newlines.
 *
 * This function replaces the original regex `/^\s*\n\s*|\s*\n\s*$/g` which was
 * vulnerable to polynomial backtracking (ReDoS). The iterative approach has
 * O(n) complexity and is immune to such attacks.
 *
 * Behavior:
 * - Leading whitespace is trimmed only if it contains at least one newline
 * - Trailing whitespace is trimmed only if it contains at least one newline
 * - Whitespace without newlines is preserved
 *
 * @param {string} str - The string to trim
 * @returns {string} The trimmed string
 * @example
 * trimNewlineWhitespace('  \n  hello  \n  ') // => 'hello'
 * trimNewlineWhitespace('  hello  ')         // => '  hello  ' (no newline)
 * trimNewlineWhitespace('\n\nhello')         // => 'hello'
 * trimNewlineWhitespace('hello\n\n')         // => 'hello'
 */
const trimNewlineWhitespace = (str) => {
  // Pass 1: Find start position (trim leading whitespace if it contains \n)
  let start = 0;
  let hasLeadingNewline = false;

  while (start < str.length) {
    const char = str[start];
    if (char === '\n') {
      hasLeadingNewline = true;
      start++;
    } else if (char === ' ' || char === '\t' || char === '\r') {
      start++;
    } else {
      break;
    }
  }

  // Only trim if we found a newline
  if (!hasLeadingNewline) start = 0;

  // Pass 2: Find end position (trim trailing whitespace if it contains \n)
  let end = str.length;
  let hasTrailingNewline = false;

  while (end > start) {
    const char = str[end - 1];
    if (char === '\n') {
      hasTrailingNewline = true;
      end--;
    } else if (char === ' ' || char === '\t' || char === '\r') {
      end--;
    } else {
      break;
    }
  }

  // Only trim if we found a newline
  if (!hasTrailingNewline) end = str.length;

  return str.slice(start, end);
};

/**
 * Build an instruction list from template literal static parts.
 *
 * This is the parser that converts HTM template syntax into an instruction
 * list that can be efficiently evaluated multiple times with different
 * interpolated values.
 *
 * The instruction list format is an array of operations:
 * - [0]: Workspace for dynamic tracking bits during evaluation
 * - [type, fieldIndex, value, ...extra]: Each operation
 *
 * Operation types:
 * - CHILD_APPEND (0): Append static child
 * - CHILD_RECURSE (2): Process nested element
 * - TAG_SET (3): Set tag name
 * - PROPS_ASSIGN (4): Spread props
 * - PROP_SET (5): Set property
 * - PROP_APPEND (6): Append to property
 *
 * @this {HFunction} The hyperscript function (not used in build, but bound for consistency)
 * @param {TemplateStringsArray} statics - The static parts of the template literal
 * @returns {BuiltTemplate} The built instruction list
 */
const build = function (statics) {
  /** @type {number} */
  let mode = MODE_TEXT;

  /** @type {string} */
  let buffer = '';

  /** @type {string} */
  let quote = '';

  /**
   * The current instruction list being built.
   * First element [0] is reserved for dynamic tracking during evaluation.
   *
   * @type {BuiltTemplate}
   */
  let current = [0];

  /** @type {string} */
  let char;

  /** @type {string} */
  let propName = '';

  /**
   * Commit the current buffer to the instruction list based on the current mode.
   *
   * @param {number} [field] - The field index if this is a dynamic value (1-based)
   */
  const commit = (field) => {
    if (mode === MODE_TEXT && (field || (buffer = trimNewlineWhitespace(buffer)))) {
      // Text content: append as child
      current.push(CHILD_APPEND, field, buffer);
    } else if (mode === MODE_TAGNAME && (field || buffer)) {
      // Tag name
      current.push(TAG_SET, field, buffer);
      mode = MODE_WHITESPACE;
    } else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
      // Spread props: ...${props}
      current.push(PROPS_ASSIGN, field, 0);
    } else if (mode === MODE_WHITESPACE && buffer && !field) {
      // Boolean attribute: <div disabled>
      current.push(PROP_SET, 0, true, buffer);
    } else if (mode >= MODE_PROP_SET) {
      // Property value
      if (buffer || (!field && mode === MODE_PROP_SET)) {
        current.push(mode, 0, buffer, propName);
        mode = MODE_PROP_APPEND;
      }
      if (field) {
        current.push(mode, field, 0, propName);
        mode = MODE_PROP_APPEND;
      }
    }

    buffer = '';
  };

  // Process each static part of the template
  let staticIndex = 0;
  for (const staticPart of statics) {
    // Between static parts, we have an interpolated value
    if (staticIndex) {
      if (mode === MODE_TEXT) {
        commit();
      }
      commit(staticIndex);
    }

    // Process each character in this static part
    for (let j = 0; j < staticPart.length; j++) {
      char = /** @type {string} */ (staticPart[j]);

      if (mode === MODE_TEXT) {
        if (char === '<') {
          // Start of a tag
          commit();
          current = [current]; // Push new instruction list, link to parent
          mode = MODE_TAGNAME;
        } else {
          buffer += char;
        }
      } else if (mode === MODE_COMMENT) {
        // Inside HTML comment: wait for -->
        if (buffer === '--' && char === '>') {
          mode = MODE_TEXT;
          buffer = '';
        } else {
          buffer = char + buffer[0];
        }
      } else if (quote) {
        // Inside quoted attribute value
        if (char === quote) {
          quote = '';
        } else {
          buffer += char;
        }
      } else if (char === '"' || char === "'") {
        // Start of quoted attribute value
        quote = char;
      } else if (char === '>') {
        // End of tag
        commit();
        mode = MODE_TEXT;
      } else if (!mode) {
        // MODE_SLASH: ignore until tag ends
      } else if (char === '=') {
        // Start of attribute value
        mode = MODE_PROP_SET;
        propName = buffer;
        buffer = '';
      } else if (char === '/' && (mode < MODE_PROP_SET || staticPart[j + 1] === '>')) {
        // Self-closing tag or closing tag
        commit();
        if (mode === MODE_TAGNAME) {
          // </tag> or < />: go back to parent
          current = /** @type {BuiltTemplate} */ (current[0]);
        }
        // Close the element
        /** @type {BuiltTemplate} */
        const parent = current;
        current = /** @type {BuiltTemplate} */ (current[0]);
        current.push(CHILD_RECURSE, 0, parent);
        mode = MODE_SLASH;
      } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // Whitespace: end of tag name or attribute name
        commit();
        mode = MODE_WHITESPACE;
      } else {
        buffer += char;
      }

      // Check for HTML comment start
      if (mode === MODE_TAGNAME && buffer === '!--') {
        mode = MODE_COMMENT;
        current = /** @type {BuiltTemplate} */ (current[0]);
      }
    }

    staticIndex++;
  }

  // Final commit for any remaining buffer
  commit();

  return current;
};

// ============================================================================
// Template Caching
// ============================================================================

/**
 * Cache for built templates, keyed by hyperscript function and template statics.
 *
 * Structure: WeakMap<HFunction, Map<TemplateStringsArray, BuiltTemplate>>
 *
 * Using WeakMap for the outer cache allows the h function to be garbage
 * collected if no longer referenced. The inner Map uses TemplateStringsArray
 * as keys, which are guaranteed to be the same object for the same template
 * literal in the source code.
 *
 * @type {WeakMap<HFunction, Map<TemplateStringsArray, BuiltTemplate>>}
 */
const CACHES = new WeakMap();

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Tagged template function bound to a hyperscript function.
 *
 * This is the main entry point returned by `htm.bind(h)`. It parses the
 * template literal, caches the result, and evaluates it with the provided
 * interpolated values.
 *
 * @this {HFunction} The bound hyperscript function
 * @param {TemplateStringsArray} statics - The static parts of the template literal
 * @returns {unknown | unknown[]} Single element or array of elements
 * @example
 * const h = (type, props, ...children) => ({ type, props, children });
 * const html = htm.bind(h);
 *
 * // Single element
 * html`<div class="foo">Hello</div>`
 * // => { type: 'div', props: { class: 'foo' }, children: ['Hello'] }
 *
 * // Multiple elements
 * html`<div /><span />`
 * // => [{ type: 'div', ... }, { type: 'span', ... }]
 */
const htm = function (statics) {
  // eslint-disable-next-line unicorn/no-this-assignment
  const h = this;
  const fields = arguments;

  // Get or create the cache for this h function
  let cache = CACHES.get(h);
  if (!cache) {
    cache = new Map();
    CACHES.set(h, cache);
  }

  // Get or build the instruction list for this template
  let built = cache.get(statics);
  if (!built) {
    built = build.call(h, statics);
    cache.set(statics, built);
  }

  // Evaluate the template with the interpolated values
  // Top-level call uses empty array; h() results are pushed to it
  const result = evaluate(h, built, fields, []);

  // Return single element directly, or array if multiple
  return result.length > 1 ? result : result[0];
};

/**
 * Bind htm to a hyperscript function.
 *
 * Creates a tagged template function that parses HTM syntax and calls the
 * provided hyperscript function to create elements.
 *
 * Note: The props parameter uses `null` (not `undefined`) for "no props" to
 * match the convention used by React's createElement, Preact's h, and other
 * hyperscript implementations.
 *
 * @template {unknown} HResult - The return type of the hyperscript function
 * @param {(type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => HResult} h - The hyperscript function
 * @returns {BoundHtm<HResult>} A tagged template function
 * @example
 * // With a simple h function
 * const h = (type, props, ...children) => ({ type, props, children });
 * const html = htm.bind(h);
 * const element = html`<div>Hello</div>`;
 *
 * // With Preact
 * import { h } from 'preact';
 * const html = htm.bind(h);
 *
 * // With React
 * import { createElement } from 'react';
 * const html = htm.bind(createElement);
 */
htm.bind = function (h) {
  return /** @type {BoundHtm<HResult>} */ (
    Function.prototype.bind.call(htm, h)
  );
};

module.exports = htm;
