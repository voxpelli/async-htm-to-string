import { assertTypeIsNever, isType, typesafeIsArray } from '@voxpelli/typed-utils';
import { bufferedAsyncMap } from 'buffered-async-iterable';
import { stringifyEntities } from 'stringify-entities';

import { renderStringItem } from '@voxpelli/html-render-utils';
import { isAsyncIterable, isIterable } from './utils.js';

/** @import { BasicRenderableElement, ElementProps, RenderableElement } from './element-types.d.ts' */
/** @import { IterableIteratorMaybeAsync, MaybePromised } from './util-types.d.ts' */

/**
 * @template T
 * @param {Array<MaybePromised<T>>} input
 * @returns {AsyncIterableIterator<T>}
 */
async function * arrayToAsyncGenerator (input) {
  for (const item of input) {
    yield item;
  }
}

/**
 * @yields {string}
 * @template {ElementProps} Props
 * @param {BasicRenderableElement<Props>} item
 * @returns {AsyncIterableIterator<string>}
 */
async function * renderElement (item) {
  const { children, props, skipStringEscape, type } = item;

  if (type === undefined) {
    throw new TypeError('Not an element definition. Missing type in: ' + JSON.stringify(item).slice(0, 50));
  } else if (type === '') {
    yield * renderItem(children);
  } else if (typeof type === 'function') {
    const result = await type(props, children);

    if (!skipStringEscape) {
      yield * typesafeIsArray(result)
        ? renderIterable(arrayToAsyncGenerator(result))
        : renderItem(result);
    } else if (!isType(result, 'string')) {
      throw new TypeError('skipStringEscape can only be used with string results');
    } else {
      yield result;
    }
  } else if (typeof type === 'string') {
    yield * renderStringItem({ type, props, children }, (children) => renderIterable(/** @type {IterableIteratorMaybeAsync<RenderableElement>} */ (children)));
  } else {
    throw new TypeError(`Invalid element type: ${typeof type}`);
  }
}

/**
 * @yields {string}
 * @param {IterableIteratorMaybeAsync<RenderableElement>} iterator
 * @returns {AsyncIterableIterator<string>}
 */
async function * renderIterable (iterator) {
  yield * bufferedAsyncMap(iterator, renderItem, { ordered: true });
}

/**
 * @yields {string}
 * @param {RenderableElement|IterableIteratorMaybeAsync<RenderableElement>} rawItem
 * @returns {AsyncIterableIterator<string>}
 */
export async function * renderItem (rawItem) {
  const item = await rawItem;

  if (item === undefined || item === null) {
    yield '';
  } else if (typeof item === 'string') {
    yield stringifyEntities(item, { escapeOnly: true, useNamedReferences: true });
  } else if (typeof item === 'number') {
    yield item + '';
  } else if (Array.isArray(item) || isIterable(item) || isAsyncIterable(item)) {
    yield * renderIterable(item);
  } else if (typeof item === 'object') {
    yield * renderElement(item);
  } else {
    assertTypeIsNever(item, `Invalid render item type: ${typeof item}`);
  }
}
