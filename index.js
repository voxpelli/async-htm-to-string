// @ts-check

'use strict';

// TODO: Use dual-publish

const htm = require('htm');

const is = require('@sindresorhus/is').default;
const escape = require('stringify-entities');

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

/** @typedef {undefined|boolean|string|number} ElementPropsValue */
/** @typedef {{ [key: string]: ElementPropsValue }} ElementProps */

/**
 * @callback RenderableElementFunction
 * @param {ElementProps} props
 * @param {RenderableElement[]} children
 * @returns {HtmlMethodResult}
 */

/**
 * @template {string|RenderableElementFunction} T
 * @typedef ComplexRenderableElement
 * @property {T} type
 * @property {ElementProps} props
 * @property {RenderableElement[]} children
 */

/** @typedef {ComplexRenderableElement<string|RenderableElementFunction>} BasicRenderableElement */
/** @typedef {string|number|BasicRenderableElement} RenderableElement */
/** @typedef {(BasicRenderableElement|string)[]|BasicRenderableElement|string} HtmlMethodResult */

/**
 * @template T
 * @typedef {T[]|IterableIterator<T>|AsyncIterableIterator<T>} IterableIteratorMaybeAsync
 */

/**
 *
 * @param {ElementProps} props
 * @returns {AsyncIterableIterator<string>}
 */
const _renderProps = async function * (props) {
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
 * @param {ComplexRenderableElement<string>} item
 * @returns {AsyncIterableIterator<string>}
 */
const _renderStringItem = async function * (item) {
  const { type, props, children } = item;

  const tag = type.toLowerCase();

  if (Object.prototype.hasOwnProperty.call(omittedCloseTags, type)) {
    yield `<${tag}`;
    yield * _renderProps(props);
    yield ` />`;
  } else if (!isTagValid(tag)) {
    throw new Error(`Invalid tag name: ${tag}`);
  } else {
    yield `<${tag}`;
    yield * _renderProps(props);
    yield `>`;
    yield * _render(children);
    yield `</${tag}>`;
  }
};

/**
 * @param {BasicRenderableElement} item
 * @returns {AsyncIterableIterator<string>}
 */
const _renderElement = async function * (item) {
  const { type, props, children } = item;

  if (type === undefined) {
    throw new TypeError('Not an element definition. Missing type in: ' + JSON.stringify(item).slice(0, 50));
  } else if (type === '') {
    yield * _render(children);
  } else if (typeof type === 'function') {
    yield * _render(type(props, children));
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
const render = async function * (item) {
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
const generatorToString = async (generator) => {
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
const renderToString = async (item) => generatorToString(render(item));

/**
 * @param {string|RenderableElementFunction} type
 * @param {ElementProps} props
 * @param  {...RenderableElement} children
 * @returns {BasicRenderableElement}
 */
const h = (type, props, ...children) => {
  return { type, props: props || {}, children };
};

/** @type {(strings: TemplateStringsArray, ...values: Array<ElementPropsValue|ElementProps|RenderableElementFunction|RenderableElement|RenderableElement[]>) => any} */
const _internalHtml =
  // @ts-ignore
  htm.bind(h);

/**
 * @param {unknown} result
 * @returns {BasicRenderableElement|string}
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
      throw new TypeError(`Unexpected nested array value found`);
    }
    /** @type {BasicRenderableElement} */
    // @ts-ignore
    const element = result;
    const { type = '', props = {}, children = [] } = element;
    return { type, props, children };
  } else {
    throw new TypeError(`Resolved to invalid value type: ${typeof result}`);
  }
};

/**
 * @param {TemplateStringsArray} strings
 * @param  {...ElementPropsValue|ElementProps|RenderableElementFunction|RenderableElement|RenderableElement[]} values
 * @returns {HtmlMethodResult}
 */
const html = (strings, ...values) => {
  const result = _internalHtml(strings, ...values);

  return Array.isArray(result)
    ? result.map(item => _checkHtmlResult(item))
    : _checkHtmlResult(result);
};

module.exports = {
  generatorToString,
  html,
  h,
  render,
  renderToString,
};
