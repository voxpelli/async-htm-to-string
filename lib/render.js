'use strict'; // linemod-remove
// linemod-add: import { renderItem } from './render-utils.mjs';
const { generatorToString } = require('./utils.js'); // linemod-replace-with: import { generatorToString } from './utils.js';

/** @import { HtmlMethodResult } from './element-types.d.ts' */

/**
 * @yields {string}
 * @param {HtmlMethodResult} rawItem
 * @returns {AsyncIterableIterator<string>}
 */
const render = async function * (rawItem) { // linemod-prefix-with: export
  const item = await rawItem;

  if (item === undefined) throw new TypeError('Expected an argument');
  if (!item) throw new TypeError(`Expected a non-falsy argument, got: ${item}`);

  if (Array.isArray(item)) {
    for (const value of item) {
      yield * render(value);
    }
  } else if (typeof item === 'string' || typeof item === 'object') {
    const { renderItem } = await import('./render-utils.mjs'); // linemod-remove
    yield * renderItem(item);
  } else {
    throw new TypeError(`Expected a string or an object, got: ${typeof item}`);
  }
};

/**
 * @param {HtmlMethodResult} item
 * @returns {Promise<string>}
 */
const renderToString = async (item) => generatorToString(render(item)); // linemod-prefix-with: export

module.exports = { // linemod-remove
  render,          // linemod-remove
  renderToString,  // linemod-remove
};                 // linemod-remove
