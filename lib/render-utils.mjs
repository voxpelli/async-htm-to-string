/* eslint-disable func-style, n/no-sync */

import { isPromise } from 'node:util/types';
import { assertTypeIsNever, isType, typesafeIsArray } from '@voxpelli/typed-utils';
import { bufferedAsyncMap } from 'buffered-async-iterable';
import { isAttributeNameValid, isTagValid, omittedCloseTags } from './react-utils.js';
import { escapeHtml } from './escape-html.js';
import { isAsyncIterable, isIterable } from './utils.js';

/** @import { BasicRenderableElement, ElementProps, RenderableElement, StringRenderableElement } from './element-types.d.ts' */
/** @import { IterableIteratorMaybeAsync, MaybePromised } from './util-types.d.ts' */

/**
 * @template T
 * @param {Array<MaybePromised<T>>} input
 * @returns {AsyncIterableIterator<T>}
 */
async function * maybePromisedArrayToAsyncGenerator (input) {
  for (const item of input) {
    yield item;
  }
}

/**
 * @yields {string}
 * @param {ElementProps} props
 * @returns {AsyncIterableIterator<string>}
 */
async function * renderProps (props) {
  // *** REACT BORROWED https://github.com/facebook/react/blob/779a472b0901b2d28e382f3850b2ad09a555b014/packages/react-dom/src/server/DOMMarkupOperations.js#L48-L72 ***
  for (const propKey in props) {
    if (!Object.hasOwn(props, propKey)) {
      continue;
    }

    const propValue = props[propKey];

    if (propValue === undefined) continue;
    if (propValue === null) continue;
    if (propValue === false) continue;

    if (!isAttributeNameValid(propKey)) {
      throw new Error(`Invalid attribute name: ${propKey}`);
    }

    if (propValue === true) {
      yield ` ${propKey}`;
    } else if (propValue === '') {
      yield ` ${propKey}=""`;
    } else if (typeof propValue === 'string') {
      yield ` ${propKey}="${escapeHtml(propValue)}"`;
    } else if (typeof propValue === 'number') {
      yield ` ${propKey}="${propValue}"`;
    } else {
      // eslint-disable-next-line no-console
      console.error('Unexpected prop value type:', typeof propValue);
    }
  }
  // *** END REACT BORROWED ***
}

/**
 * @yields {string}
 * @template {ElementProps} Props
 * @param {StringRenderableElement<Props>} item
 * @returns {AsyncIterableIterator<string>}
 */
async function * renderStringItem (item) {
  const { children, props, type } = item;

  const tag = type.toLowerCase();

  if (tag in omittedCloseTags) {
    yield `<${tag}`;
    yield * renderProps(props);
    yield ' />';
  } else if (!isTagValid(tag)) {
    throw new Error(`Invalid tag name: ${tag}`);
  } else {
    yield `<${tag}`;
    yield * renderProps(props);
    yield '>';
    yield * renderItem(children);
    yield `</${tag}>`;
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
    const rawResult = type(props, children);
    const result = isPromise(rawResult) ? await rawResult : rawResult;

    if (!skipStringEscape) {
      if (typeof result === 'object' && result !== null && !Array.isArray(result) && result.async === false) {
        try {
          yield renderItemSync(result);
        } catch (err) {
          if (!(err instanceof AsyncFallbackError)) throw err;
          yield * renderItem(result);
        }
      } else {
        yield * typesafeIsArray(result)
          ? renderIterable(maybePromisedArrayToAsyncGenerator(result))
          : renderItem(result);
      }
    } else if (!isType(result, 'string')) {
      throw new TypeError('skipStringEscape can only be used with string results');
    } else {
      yield result;
    }
  } else if (typeof type === 'string') {
    yield * renderStringItem({ type, props, children });
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
  if (Array.isArray(iterator)) {
    for (const item of iterator) yield * renderItem(item);
  } else {
    yield * bufferedAsyncMap(iterator, renderItem, { ordered: true });
  }
}

/**
 * @yields {string}
 * @param {RenderableElement|IterableIteratorMaybeAsync<RenderableElement>} rawItem
 * @returns {AsyncIterableIterator<string>}
 */
export async function * renderItem (rawItem) {
  const item = isPromise(rawItem) ? await rawItem : rawItem;

  if (item === undefined || item === null) {
    yield '';
  } else if (typeof item === 'string') {
    yield escapeHtml(item);
  } else if (typeof item === 'number') {
    yield item + '';
  } else if (Array.isArray(item) || isIterable(item) || isAsyncIterable(item)) {
    yield * renderIterable(/** @type {IterableIteratorMaybeAsync<RenderableElement>} */ (item));
  } else if (typeof item === 'object') {
    yield * renderElement(/** @type {BasicRenderableElement<ElementProps>} */ (item));
  } else {
    // @ts-expect-error — narrowing incomplete due to isPromise ternary
    assertTypeIsNever(item, `Invalid render item type: ${typeof item}`);
  }
}

// *** SYNC RENDER FUNCTIONS ***

class AsyncFallbackError extends Error {
  constructor () {
    super('ASYNC_FALLBACK');
    this.name = 'AsyncFallbackError';
  }
}

/**
 * @param {ElementProps} props
 * @returns {string}
 */
function renderPropsSync (props) {
  let result = '';

  for (const propKey in props) {
    if (!Object.hasOwn(props, propKey)) {
      continue;
    }

    const propValue = props[propKey];

    if (propValue === undefined) continue;
    if (propValue === null) continue;
    if (propValue === false) continue;

    if (!isAttributeNameValid(propKey)) {
      throw new Error(`Invalid attribute name: ${propKey}`);
    }

    if (propValue === true) {
      result += ` ${propKey}`;
    } else if (propValue === '') {
      result += ` ${propKey}=""`;
    } else if (typeof propValue === 'string') {
      result += ` ${propKey}="${escapeHtml(propValue)}"`;
    } else if (typeof propValue === 'number') {
      result += ` ${propKey}="${propValue}"`;
    } else {
      // eslint-disable-next-line no-console
      console.error('Unexpected prop value type:', typeof propValue);
    }
  }

  return result;
}

/**
 * @template {ElementProps} Props
 * @param {StringRenderableElement<Props>} item
 * @returns {string}
 */
function renderStringItemSync (item) {
  const { children, props, type } = item;

  const tag = type.toLowerCase();

  if (tag in omittedCloseTags) {
    return `<${tag}${renderPropsSync(props)} />`;
  } else if (!isTagValid(tag)) {
    throw new Error(`Invalid tag name: ${tag}`);
  } else {
    return `<${tag}${renderPropsSync(props)}>${renderChildrenSync(children)}</${tag}>`;
  }
}

/**
 * @template {ElementProps} Props
 * @param {BasicRenderableElement<Props>} item
 * @returns {string}
 */
function renderElementSync (item) {
  const { children, props, skipStringEscape, type } = item;

  if (type === undefined) {
    throw new TypeError('Not an element definition. Missing type in: ' + JSON.stringify(item).slice(0, 50));
  } else if (type === '') {
    return renderChildrenSync(children);
  } else if (typeof type === 'function') {
    const result = type(props, children);

    if (isPromise(result)) {
      throw new AsyncFallbackError();
    }

    if (!skipStringEscape) {
      return renderItemSync(/** @type {RenderableElement | RenderableElement[]} */ (result));
    } else if (typeof result !== 'string') {
      throw new TypeError('skipStringEscape can only be used with string results');
    } else {
      return result;
    }
  } else if (typeof type === 'string') {
    return renderStringItemSync({ type, props, children });
  } else {
    throw new TypeError(`Invalid element type: ${typeof type}`);
  }
}

/**
 * @param {RenderableElement[]} children
 * @returns {string}
 */
function renderChildrenSync (children) {
  let result = '';
  for (const child of children) {
    result += renderItemSync(child);
  }
  return result;
}

/**
 * @param {RenderableElement|RenderableElement[]} rawItem
 * @returns {string}
 */
export function renderItemSync (rawItem) {
  if (isPromise(rawItem)) {
    throw new AsyncFallbackError();
  }

  /** @type {RenderableElement | RenderableElement[]} */
  const item = rawItem;

  if (item === undefined || item === null) {
    return '';
  } else if (typeof item === 'string') {
    return escapeHtml(item);
  } else if (typeof item === 'number') {
    return item + '';
  } else if (Array.isArray(item)) {
    return item.map(/** @type {(child: RenderableElement) => string} */ (child) => renderItemSync(child)).join('');
  } else if (typeof item === 'object') {
    return renderElementSync(/** @type {BasicRenderableElement<any>} */ (item));
  } else {
    throw new TypeError(`Invalid render item type: ${typeof item}`);
  }
}

export { AsyncFallbackError };
