/* eslint-disable n/no-sync */

import { isPromise } from 'node:util/types';
import { generatorToString } from './utils.js';
import { renderItem, renderItemSync, AsyncFallbackError } from './render-utils.js';

/** @import { BasicRenderableElement, ElementProps, HtmlMethodResult } from './element-types.d.ts' */

/**
 * @param {HtmlMethodResult} rawItem
 * @returns {string}
 */
export const renderSync = (rawItem) => {
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
// eslint-disable-next-line func-style
export const render = async function * (rawItem) {
  const item = isPromise(rawItem) ? await rawItem : rawItem;

  if (item === undefined) throw new TypeError('Expected an argument');
  if (!item) throw new TypeError(`Expected a non-falsy argument, got: ${item}`);

  if (Array.isArray(item)) {
    for (const value of item) {
      yield * render(value);
    }
  } else if (typeof item === 'string' || typeof item === 'object') {
    yield * renderItem(item);
  } else {
    throw new TypeError(`Expected a string or an object, got: ${typeof item}`);
  }
};

/**
 * @param {HtmlMethodResult} item
 * @returns {Promise<string>}
 */
export const renderToString = async (item) => {
  // Fast path: sync element tree
  if (typeof item === 'object' && item !== null && !Array.isArray(item) && !isPromise(item) && /** @type {BasicRenderableElement<ElementProps>} */ (item).async === false) {
    try {
      return renderSync(item);
    } catch (err) {
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
export const renderToStringSync = (item) => {
  if (isPromise(item)) throw new TypeError('Cannot sync-render a Promise value');
  try {
    return renderSync(item);
  } catch (err) {
    if (err instanceof AsyncFallbackError) {
      throw new TypeError('Cannot sync-render: an async component was encountered');
    }
    throw err;
  }
};
