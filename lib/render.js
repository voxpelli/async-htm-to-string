/* eslint-disable n/no-sync */
'use strict'; // linemod-remove
// linemod-add: import { renderItem, renderItemSync, AsyncFallbackError } from './render-utils.mjs';
const { isPromise } = require('node:util/types'); // linemod-replace-with: import { isPromise } from 'node:util/types';
const { generatorToString } = require('./utils.js'); // linemod-replace-with: import { generatorToString } from './utils.js';

/** @import { BasicRenderableElement, ElementProps, HtmlMethodResult } from './element-types.d.ts' */

/**
 * @param {HtmlMethodResult} rawItem
 * @returns {string}
 */
const renderSync = (rawItem) => { // linemod-prefix-with: export
  const { renderItemSync } = require('./render-utils.mjs'); // linemod-remove

  if (isPromise(rawItem)) throw new TypeError('Cannot sync-render a Promise value');

  const item = rawItem;

  if (item === undefined) throw new TypeError('Expected an argument');
  if (!item) throw new TypeError(`Expected a non-falsy argument, got: ${item}`);

  if (Array.isArray(item)) {
    return item.map(value => renderSync(value)).join('');
  } else if (typeof item === 'string' || typeof item === 'object') {
    return renderItemSync(item);
  } else {
    throw new TypeError(`Expected a string or an object, got: ${typeof item}`);
  }
};

/**
 * @yields {string}
 * @param {HtmlMethodResult} rawItem
 * @returns {AsyncIterableIterator<string>}
 */
const render = async function * (rawItem) { // linemod-prefix-with: export
  const item = isPromise(rawItem) ? await rawItem : rawItem;

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
const renderToString = async (item) => { // linemod-prefix-with: export
  // Fast path: sync element tree
  if (typeof item === 'object' && item !== null && !Array.isArray(item) && !isPromise(item) && /** @type {BasicRenderableElement<ElementProps>} */ (item).async === false) {
    try {
      return renderSync(item);
    } catch (err) {
      const { AsyncFallbackError } = await import('./render-utils.mjs'); // linemod-remove
      if (!(/** @type {Error} */ (err) instanceof AsyncFallbackError)) throw err;
      // Fall through to async path
    }
  }
  return generatorToString(render(item));
};

/**
 * @param {HtmlMethodResult} item
 * @returns {string}
 */
const renderToStringSync = (item) => { // linemod-prefix-with: export
  if (isPromise(item)) throw new TypeError('Cannot sync-render a Promise value');
  try {
    return renderSync(item);
  } catch (err) {
    const { AsyncFallbackError } = require('./render-utils.mjs'); // linemod-remove
    if (err instanceof AsyncFallbackError) {
      throw new TypeError('Cannot sync-render: an async component was encountered');
    }
    throw err;
  }
};

module.exports = { // linemod-remove
  render,          // linemod-remove
  renderSync,      // linemod-remove
  renderToString,  // linemod-remove
  renderToStringSync, // linemod-remove
};                 // linemod-remove
