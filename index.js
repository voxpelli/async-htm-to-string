// @ts-check

'use strict';

const htm = require('htm'); // linemod-replace-with: import htm from 'htm';

const is = require('@sindresorhus/is').default; // linemod-replace-with: import is from '@sindresorhus/is';
const escape = require('stringify-entities'); // linemod-replace-with: import escape from 'stringify-entities';

// *** REACT BORROWED ***
const ATTRIBUTE_NAME_START_CHAR =
  ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
const ATTRIBUTE_NAME_CHAR =
  ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040';

// eslint-disable-next-line no-misleading-character-class,security/detect-non-literal-regexp
const VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');

const VALID_TAG_REGEX = /^[A-Za-z][\w.:-]*$/; // Simplified subset

/** @type {Map<string, boolean>} */
const validatedTagCache = new Map();
/**
 * @param {string} tag
 * @returns {boolean}
 */
const isTagValid = (tag) => {
  const cached = validatedTagCache.get(tag);

  if (cached !== undefined) return cached;

  const result = VALID_TAG_REGEX.test(tag);
  validatedTagCache.set(tag, result);
  return result;
};

/** @type {Map<string, boolean>} */
const validatedAttributeNameCache = new Map();
/**
 * @param {string} name
 * @returns {boolean}
 */
const isAttributeNameValid = (name) => {
  const cached = validatedAttributeNameCache.get(name);

  if (cached !== undefined) return cached;

  const result = VALID_ATTRIBUTE_NAME_REGEX.test(name);
  validatedAttributeNameCache.set(name, result);
  return result;
};

const omittedCloseTags = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};
// *** END REACT BORROWED ***

/**
 * @template T
 * @typedef {T|T[]} MaybeArray
 */

/** @typedef {undefined|boolean|string|number|any[]|Record<string,any>|Set<any>|Map<any,any>} ElementPropsValue */
/** @typedef {{ [key: string]: ElementPropsValue }} ElementProps */

/**
 * @template {ElementProps} Props
 * @callback RenderableElementFunction
 * @param {Props} props
 * @param {RenderableElement[]} children
 * @returns {HtmlMethodResult}
 */

/** @typedef {RenderableElementFunction<ElementProps>} SimpleRenderableElementFunction */

/**
 * @template {ElementProps} Props
 * @typedef StringRenderableElement
 * @property {string} type
 * @property {Props} props
 * @property {RenderableElement[]} children
 */

/**
 * @template {ElementProps} Props
 * @typedef BasicRenderableElement
 * @property {string|RenderableElementFunction<Props>} type
 * @property {Props} props
 * @property {RenderableElement[]} children
 * @property {boolean} [skipStringEscape]
 */

/** @typedef {string|number|BasicRenderableElement<any>} RenderableElement */
/** @typedef {MaybeArray<BasicRenderableElement<ElementProps>|string>} HtmlMethodResult */

/**
 * @template T
 * @typedef {T[]|IterableIterator<T>|AsyncIterableIterator<T>} IterableIteratorMaybeAsync
 */

// eslint-disable-next-line jsdoc/require-returns-check
/**
 * @param {ElementProps} props
 * @returns {Generator<string>}
 */
const _renderProps = function * (props) {
  // *** REACT BORROWED https://github.com/facebook/react/blob/779a472b0901b2d28e382f3850b2ad09a555b014/packages/react-dom/src/server/DOMMarkupOperations.js#L48-L72 ***
  for (const propKey in props) {
    if (!Object.prototype.hasOwnProperty.call(props, propKey)) {
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
      yield ` ${propKey}="${escape(propValue, { useNamedReferences: true })}"`;
    } else if (typeof propValue === 'number') {
      yield ` ${propKey}="${propValue}"`;
    } else {
      // eslint-disable-next-line no-console
      console.error('Unexpected prop value type:', typeof propValue);
    }
  }
  // *** END REACT BORROWED ***
};

/**
 * @template {ElementProps} Props
 * @param {StringRenderableElement<Props>} item
 * @returns {AsyncIterableIterator<string>}
 */
const _renderStringItem = async function * (item) {
  const { children, props, type } = item;

  const tag = type.toLowerCase();

  if (Object.prototype.hasOwnProperty.call(omittedCloseTags, type)) {
    yield `<${tag}`;
    yield * _renderProps(props);
    yield ' />';
  } else if (!isTagValid(tag)) {
    throw new Error(`Invalid tag name: ${tag}`);
  } else {
    yield `<${tag}`;
    yield * _renderProps(props);
    yield '>';
    yield * _render(children);
    yield `</${tag}>`;
  }
};

/**
 * @template {ElementProps} Props
 * @param {BasicRenderableElement<Props>} item
 * @returns {AsyncIterableIterator<string>}
 */
const _renderElement = async function * (item) {
  const { children, props, skipStringEscape, type } = item;

  if (type === undefined) {
    throw new TypeError('Not an element definition. Missing type in: ' + JSON.stringify(item).slice(0, 50));
  } else if (type === '') {
    yield * _render(children);
  } else if (typeof type === 'function') {
    const result = type(props, children);
    if (!skipStringEscape) {
      yield * _render(result);
    } else if (typeof result !== 'string') {
      throw new TypeError('skipStringEscape can only be used with string results');
    } else {
      yield result;
    }
  } else if (typeof type === 'string') {
    yield * _renderStringItem({ type, props, children });
  } else {
    throw new TypeError(`Invalid element type: ${typeof type}`);
  }
};

/**
 * @param {IterableIteratorMaybeAsync<RenderableElement>} iterator
 * @returns {AsyncIterableIterator<string>}
 */
const _renderIterable = async function * (iterator) {
  for await (const item of iterator) {
    yield * _render(item);
  }
};

/**
 * @param {RenderableElement|IterableIteratorMaybeAsync<RenderableElement>} item
 * @returns {AsyncIterableIterator<string>}
 */
const _render = async function * (item) {
  if (item === undefined || item === null) {
    yield '';
  } else if (typeof item === 'string') {
    yield escape(item, { useNamedReferences: true });
  } else if (typeof item === 'number') {
    yield item + '';
  } else if (Array.isArray(item) || is.iterable(item) || is.asyncIterable(item)) {
    yield * _renderIterable(item);
  } else if (typeof item === 'object') {
    yield * _renderElement(item);
  } else {
    throw new TypeError(`Invalid render item type: ${typeof item}`);
  }
};

/**
 * @param {HtmlMethodResult} item
 * @returns {AsyncIterableIterator<string>}
 */
const render = async function * (item) { // linemod-prefix-with: export
  if (item === undefined) throw new TypeError('Expected an argument');
  if (!item) throw new TypeError(`Expected a non-falsy argument, got: ${item}`);
  if (Array.isArray(item)) {
    for (const value of item) {
      yield * render(value);
    }
  } else if (typeof item === 'string' || typeof item === 'object') {
    yield * _render(item);
  } else {
    throw new TypeError(`Expected a string or an object, got: ${typeof item}`);
  }
};

/**
 * @param {IterableIteratorMaybeAsync<string>} generator
 * @returns {Promise<string>}
 */
const generatorToString = async (generator) => { // linemod-prefix-with: export
  let result = '';
  for await (const item of generator) {
    result += item;
  }
  return result;
};

/**
 * @param {HtmlMethodResult} item
 * @returns {Promise<string>}
 */
const renderToString = async (item) => generatorToString(render(item)); // linemod-prefix-with: export

/**
 * @template {ElementProps} T
 * @param {string|RenderableElementFunction<T>} type
 * @param {T} props
 * @param  {...RenderableElement} children
 * @returns {BasicRenderableElement<T>}
 */
const h = (type, props, ...children) => { // linemod-prefix-with: export
  return { type, props: props || {}, children };
};

/** @type {(strings: TemplateStringsArray, ...values: Array<ElementPropsValue|ElementProps|RenderableElementFunction<any>|RenderableElement|RenderableElement[]>) => unknown} */
const _internalHtml =
  // @ts-ignore
  htm.bind(h);

/**
 * @param {unknown} result
 * @returns {BasicRenderableElement<ElementProps>|string}
 */
const _checkHtmlResult = (result) => {
  if (typeof result === 'number') {
    return result + '';
  } else if (!result) {
    return '';
  } else if (typeof result === 'string') {
    return result;
  } else if (typeof result === 'object' && result !== null) {
    if (Array.isArray(result)) {
      throw new TypeError('Unexpected nested array value found');
    }
    /** @type {BasicRenderableElement<ElementProps>} */
    // @ts-ignore
    const element = result;
    const { type, props = {}, children = [] } = element;

    if (typeof type === 'string' || typeof type === 'function') {
      return { type, props, children: children.flat() };
    }

    throw new TypeError(`Resolved to invalid type of object value "type" property: ${typeof type}`);
  } else {
    throw new TypeError(`Resolved to invalid value type: ${typeof result}`);
  }
};

/**
 * @param {TemplateStringsArray} strings
 * @param  {...ElementPropsValue|ElementProps|RenderableElementFunction<any>|RenderableElement|RenderableElement[]} values
 * @returns {HtmlMethodResult}
 */
const html = (strings, ...values) => { // linemod-prefix-with: export
  const result = _internalHtml(strings, ...values);

  if (!Array.isArray(result)) return _checkHtmlResult(result);

  /** @type {unknown[]} */
  const unknownArray = result;

  return unknownArray.map(item => _checkHtmlResult(item));
};

/**
 * @param {TemplateStringsArray|string} strings
 * @param  {...(string|number)} values
 * @returns {BasicRenderableElement<{}>}
 */
const rawHtml = (strings, ...values) => { // linemod-prefix-with: export
  /** @type {RenderableElementFunction<{}>} */
  const type = () => typeof strings === 'string' ? strings : String.raw(strings, ...values);
  return { type, props: {}, children: [], skipStringEscape: true };
};

module.exports = {   // linemod-remove
  generatorToString, // linemod-remove
  html,              // linemod-remove
  h,                 // linemod-remove
  rawHtml,           // linemod-remove
  render,            // linemod-remove
  renderToString,    // linemod-remove
};                   // linemod-remove
