/**
 * htm v3.1.1 - Hyperscript Tagged Markup
 * https://github.com/developit/htm
 *
 * Copyright 2018 Google Inc.
 * Licensed under the Apache License, Version 2.0
 * See ./htm-LICENSE for full license text
 *
 * Vendored into async-htm-to-string for maintenance stability.
 * Converted to JSDoc typing and neostandard formatting.
 */

'use strict';

// Parser modes
const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_COMMENT = 4;
const MODE_PROP_SET = 5;
const MODE_PROP_APPEND = 6;

// Operation types for the built instruction list
const CHILD_APPEND = 0;
const CHILD_RECURSE = 2;
const TAG_SET = 3;
const PROPS_ASSIGN = 4;
const PROP_SET = MODE_PROP_SET;
const PROP_APPEND = MODE_PROP_APPEND;

/**
 * @typedef {(type: unknown, props: Record<string, unknown> | undefined, ...children: unknown[]) => unknown} HFunction
 */

/**
 * @typedef {unknown[]} BuiltTemplate
 */

/**
 * Evaluate a built template with the provided field values.
 *
 * @param {HFunction} h - The hyperscript function
 * @param {BuiltTemplate} built - The built instruction list
 * @param {ArrayLike<unknown>} fields - Template literal interpolated values
 * @param {unknown[]} args - Accumulator for h() arguments (empty for top-level, ['', undefined] for recursive)
 * @returns {unknown[]} The evaluated arguments array
 */
const evaluate = (h, built, fields, args) => {
  /** @type {unknown} */
  let tmp;

  // `build()` used the first element of the operation list as
  // temporary workspace. Now that `build()` is done we can use
  // that space to track whether the current element is "dynamic"
  // (i.e. it or any of its descendants depend on dynamic values).
  built[0] = 0;

  for (let i = 1; i < built.length; i++) {
    const type = /** @type {number} */ (built[i++]);

    // Set `built[0]`'s appropriate bits if this element depends on a dynamic value.
    const value = built[i]
      ? ((built[0] = /** @type {number} */ (built[0]) | (type ? 1 : 2)), fields[/** @type {number} */ (built[i++])])
      : built[++i];

    switch (type) {
      case TAG_SET:
        args[0] = /** @type {string} */ (value);
        break;
      case PROPS_ASSIGN:
        args[1] = Object.assign(args[1] || {}, value);
        break;
      case PROP_SET:
        (args[1] = /** @type {Record<string, unknown>} */ (args[1] || {}))[/** @type {string} */ (built[++i])] = value;
        break;
      case PROP_APPEND:
        /** @type {Record<string, unknown>} */ (args[1])[/** @type {string} */ (built[++i])] += String(value);
        break;
      case CHILD_RECURSE: {
        // Set the operation list (including the staticness bits) as
        // `this` for the `h` call.
        const childBuilt = /** @type {BuiltTemplate} */ (value);
        tmp = h.apply(childBuilt, /** @type {Parameters<HFunction>} */ (evaluate(h, childBuilt, fields, ['', undefined])));
        args.push(tmp);

        if (childBuilt[0]) {
          // Set the 2nd lowest bit if the child element is dynamic.
          built[0] = /** @type {number} */ (built[0]) | 2;
        } else {
          // Rewrite the operation list in-place if the child element is static.
          // The currently evaluated piece `CHILD_RECURSE, 0, [...]` becomes
          // `CHILD_APPEND, 0, tmp`.
          // Essentially the operation list gets optimized for potential future
          // re-evaluations.
          built[i - 2] = CHILD_APPEND;
          built[i] = tmp;
        }
        break;
      }
      default:
        // type === CHILD_APPEND (0)
        args.push(value);
    }
  }

  return args;
};

/**
 * Trim leading/trailing whitespace that contains newlines.
 * Uses a two-pass approach to avoid regex backtracking issues.
 *
 * @param {string} str - The string to trim
 * @returns {string} The trimmed string
 */
const trimNewlineWhitespace = (str) => {
  // Trim leading whitespace if it contains a newline
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
  if (!hasLeadingNewline) start = 0;

  // Trim trailing whitespace if it contains a newline
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
  if (!hasTrailingNewline) end = str.length;

  return str.slice(start, end);
};

/**
 * Build an instruction list from template literal statics.
 * This function is called with `this` bound to the h function.
 *
 * @this {HFunction}
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
  /** @type {BuiltTemplate} */
  let current = [0];
  /** @type {string} */
  let char;
  /** @type {string} */
  let propName = '';

  /**
   * Commit the current buffer based on the current mode.
   *
   * @param {number} [field] - The field index if this is a dynamic value
   */
  const commit = (field) => {
    if (mode === MODE_TEXT && (field || (buffer = trimNewlineWhitespace(buffer)))) {
      current.push(CHILD_APPEND, field, buffer);
    } else if (mode === MODE_TAGNAME && (field || buffer)) {
      current.push(TAG_SET, field, buffer);
      mode = MODE_WHITESPACE;
    } else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
      current.push(PROPS_ASSIGN, field, 0);
    } else if (mode === MODE_WHITESPACE && buffer && !field) {
      current.push(PROP_SET, 0, true, buffer);
    } else if (mode >= MODE_PROP_SET) {
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

  let staticIndex = 0;
  for (const staticPart of statics) {
    if (staticIndex) {
      if (mode === MODE_TEXT) {
        commit();
      }
      commit(staticIndex);
    }

    for (let j = 0; j < staticPart.length; j++) {
      char = /** @type {string} */ (staticPart[j]);

      if (mode === MODE_TEXT) {
        if (char === '<') {
          // commit buffer
          commit();
          current = [current];
          mode = MODE_TAGNAME;
        } else {
          buffer += char;
        }
      } else if (mode === MODE_COMMENT) {
        // Ignore everything until the last three characters are '-', '-' and '>'
        if (buffer === '--' && char === '>') {
          mode = MODE_TEXT;
          buffer = '';
        } else {
          buffer = char + buffer[0];
        }
      } else if (quote) {
        if (char === quote) {
          quote = '';
        } else {
          buffer += char;
        }
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '>') {
        commit();
        mode = MODE_TEXT;
      } else if (!mode) {
        // Ignore everything until the tag ends (MODE_SLASH)
      } else if (char === '=') {
        mode = MODE_PROP_SET;
        propName = buffer;
        buffer = '';
      } else if (char === '/' && (mode < MODE_PROP_SET || staticPart[j + 1] === '>')) {
        commit();
        if (mode === MODE_TAGNAME) {
          current = /** @type {BuiltTemplate} */ (current[0]);
        }
        /** @type {BuiltTemplate} */
        const parent = current;
        current = /** @type {BuiltTemplate} */ (current[0]);
        current.push(CHILD_RECURSE, 0, parent);
        mode = MODE_SLASH;
      } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a disabled>
        commit();
        mode = MODE_WHITESPACE;
      } else {
        buffer += char;
      }

      if (mode === MODE_TAGNAME && buffer === '!--') {
        mode = MODE_COMMENT;
        current = /** @type {BuiltTemplate} */ (current[0]);
      }
    }

    staticIndex++;
  }
  commit();

  return current;
};

/** @type {WeakMap<HFunction, Map<TemplateStringsArray, BuiltTemplate>>} */
const CACHES = new WeakMap();

/**
 * Tagged template function bound to a hyperscript function.
 * This is the main entry point returned by htm.bind(h).
 *
 * @this {HFunction}
 * @param {TemplateStringsArray} statics - The static parts of the template literal
 * @returns {unknown | unknown[]} The result of evaluating the template
 */
const htm = function (statics) {
  // eslint-disable-next-line unicorn/no-this-assignment
  const h = this;
  const fields = arguments;

  let cache = CACHES.get(h);
  if (!cache) {
    cache = new Map();
    CACHES.set(h, cache);
  }

  let built = cache.get(statics);
  if (!built) {
    built = build.call(h, statics);
    cache.set(statics, built);
  }

  // Top-level call uses empty array, h() call results are pushed to it
  const result = evaluate(h, built, fields, []);
  return result.length > 1 ? result : result[0];
};

/**
 * Bind htm to a hyperscript function.
 *
 * @template {unknown} HResult
 * @param {(type: unknown, props: Record<string, unknown> | undefined, ...children: unknown[]) => HResult} h - The hyperscript function
 * @returns {(strings: TemplateStringsArray, ...values: unknown[]) => HResult | HResult[]} A tagged template function
 */
htm.bind = function (h) {
  return /** @type {(strings: TemplateStringsArray, ...values: unknown[]) => HResult | HResult[]} */ (
    Function.prototype.bind.call(htm, h)
  );
};

module.exports = htm;
