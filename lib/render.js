/* eslint-disable n/no-sync */

import { isPromise } from 'node:util/types';
import { assertTypeIsNever, explainVariable } from '@voxpelli/typed-utils';
import { generatorToString } from './utils.js';
import { renderItem, renderItemSync, AsyncFallbackError } from './render-utils.js';

/** @import { BasicRenderableElement, ElementProps, HtmlMethodResult } from './element-types.d.ts' */

/** @type {(rawItem: HtmlMethodResult) => string} */
export const renderSync = (rawItem) => {
  if (isPromise(rawItem)) throw new TypeError('Cannot sync-render a Promise value');

  const item = rawItem;

  if (item === undefined) {
    throw new TypeError('Expected an argument');
  } else if (typeof item === 'string') {
    return renderItemSync(item);
  } else if (Array.isArray(item)) {
    return item.map(value => renderSync(value)).join('');
  } else if (typeof item === 'object' && item !== null) {
    return renderItemSync(item);
  } else {
    /* c8 ignore next */
    assertTypeIsNever(item, `Expected a renderable value, got: ${explainVariable(item)}`);
  }
};

/** @type {(rawItem: HtmlMethodResult) => AsyncIterableIterator<string>} */
// eslint-disable-next-line func-style
export const render = async function * (rawItem) {
  const item = isPromise(rawItem) ? await rawItem : rawItem;

  if (item === undefined) {
    throw new TypeError('Expected an argument');
  } else if (typeof item === 'string') {
    yield * renderItem(item);
  } else if (Array.isArray(item)) {
    for (const value of item) {
      yield * render(value);
    }
  } else if (typeof item === 'object' && item !== null) {
    yield * renderItem(item);
  } else {
    /* c8 ignore next */
    assertTypeIsNever(item, `Expected a renderable value, got: ${explainVariable(item)}`);
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
