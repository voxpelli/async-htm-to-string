import { generatorToString } from '@voxpelli/async-iterable-to-string';
import { renderItem } from './render-utils.mjs';

/** @import { HtmlMethodResult } from './element-types.d.ts' */

/**
 * @yields {string}
 * @param {HtmlMethodResult} rawItem
 * @returns {AsyncIterableIterator<string>}
 */
export async function * render (rawItem) {
  const item = await rawItem;

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
}

/**
 * @param {HtmlMethodResult} item
 * @returns {Promise<string>}
 */
export const renderToString = async (item) => generatorToString(render(item));
