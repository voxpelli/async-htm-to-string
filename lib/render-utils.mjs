/* eslint-disable func-style */

import { bufferedAsyncMap } from 'buffered-async-iterable';
import { stringifyEntities } from 'stringify-entities';

import { isAttributeNameValid, isTagValid, omittedCloseTags } from './react-utils.js';
import { isAsyncIterable, isIterable } from './utils.js';

/** @import { BasicRenderableElement, ElementProps, RenderableElement, StringRenderableElement } from './element-types.js' */
/** @import { IterableIteratorMaybeAsync } from './util-types.js' */

/**
 * @yields {string}
 * @param {ElementProps} props
 * @returns {AsyncIterableIterator<string>}
 */
async function * renderProps (props) {
  const { stringifyEntities } = await import('stringify-entities'); // linemod-remove

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
      yield ` ${propKey}="${stringifyEntities(propValue, { escapeOnly: true, useNamedReferences: true })}"`;
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

  if (type in omittedCloseTags) {
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
    // TODO: Why can't this be async?
    const result = type(props, children);
    if (!skipStringEscape) {
      yield * renderItem(result);
    } else if (typeof result !== 'string') {
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
 * @param {IterableIteratorMaybeAsync<import('../index.js').RenderableElement>} iterator
 * @returns {AsyncIterableIterator<string>}
 */
async function * renderIterable (iterator) {
  yield * bufferedAsyncMap(iterator, renderItem, { ordered: true });
}

/**
 * @yields {string}
 * @param {RenderableElement|IterableIteratorMaybeAsync<RenderableElement>} item
 * @returns {AsyncIterableIterator<string>}
 */
export async function * renderItem (item) {
  if (item === undefined || item === null) {
    yield '';
  } else if (typeof item === 'string') {
    yield stringifyEntities(item, { escapeOnly: true, useNamedReferences: true });
  } else if (typeof item === 'number') {
    yield item + '';
  } else {
    if (Array.isArray(item) || isIterable(item) || isAsyncIterable(item)) {
      yield * renderIterable(item);
    } else if (typeof item === 'object') {
      yield * renderElement(item);
    } else {
      throw new TypeError(`Invalid render item type: ${typeof item}`);
    }
  }
}
