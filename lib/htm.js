'use strict';

const htm = require('htm');

/** @import { BasicRenderableElement, ElementProps, ElementPropsValue, HtmlMethodResult, RenderableElement, RenderableElementFunction } from './element-types.js' */

/**
 * @template {ElementProps} T
 * @param {string|RenderableElementFunction<T>} type
 * @param {T} props
 * @param  {...RenderableElement} children
 * @returns {BasicRenderableElement<T>}
 */
const h = (type, props, ...children) => {
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
    const { children = [], props = {}, type } = element;

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
const html = (strings, ...values) => {
  const result = _internalHtml(strings, ...values);

  if (!Array.isArray(result)) return _checkHtmlResult(result);

  /** @type {unknown[]} */
  const unknownArray = result;

  return unknownArray.flat().map(item => _checkHtmlResult(item));
};

/**
 * @param {TemplateStringsArray|string} strings
 * @param  {...(string|number)} values
 * @returns {BasicRenderableElement<{}>}
 */
const rawHtml = (strings, ...values) => {
  /** @type {RenderableElementFunction<{}>} */
  const type = () => typeof strings === 'string' ? strings : String.raw(strings, ...values);
  return { type, props: {}, children: [], skipStringEscape: true };
};

module.exports = {
  html,
  h,
  rawHtml,
};
