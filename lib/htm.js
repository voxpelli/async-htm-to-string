import { isPromise } from 'node:util/types';
import htm from 'htm';
import { isType } from '@voxpelli/typed-utils';

/** @import { BasicRenderableElement, ElementProps, HtmlMethodResult, HtmlTemplateValue, RenderableElement, RenderableElementFunction } from './element-types.d.ts' */
/** @import { MaybePromised } from './util-types.d.ts' */

/**
 * @param {RenderableElement} child
 * @returns {boolean}
 */
const isSyncChild = (child) =>
  // eslint-disable-next-line unicorn/no-null -- checking for both null and undefined
  child == null || /** @type {unknown} */ (child) === false ||
  typeof child === 'string' || typeof child === 'number' ||
  (typeof child === 'object' && child !== null && !Array.isArray(child) && child.async === false);

/**
 * @template {ElementProps} T
 * @param {string|RenderableElementFunction<T>} type
 * @param {T} props
 * @param  {...RenderableElement} children
 * @returns {BasicRenderableElement<T>}
 */
export const h = (type, props, ...children) => {
  /** @type {BasicRenderableElement<T>} */
  const element = { type, props: props || {}, children };

  if (typeof type === 'string' && children.every(child => isSyncChild(child))) {
    element.async = false;
  }

  return element;
};

/** @type {(strings: TemplateStringsArray, ...values: Array<HtmlTemplateValue>) => unknown} */
const _internalHtml =
  // @ts-ignore
  htm.bind(h);

/**
 * @param {unknown} result
 * @returns {MaybePromised<BasicRenderableElement<ElementProps>|string>}
 */
const _checkHtmlResult = (result) => {
  if (typeof result === 'number') {
    return result + '';
  } else if (!result) {
    return '';
  } else if (typeof result === 'string') {
    return result;
  } else if (isPromise(result)) {
    // eslint-disable-next-line promise/prefer-await-to-then
    return result.then(item => _checkHtmlResult(item));
  } else if (isType(result, 'array')) {
    throw new TypeError('Unexpected nested array value found');
  } else if (isType(result, 'object')) {
    /** @type {BasicRenderableElement<ElementProps>} */
    // @ts-ignore
    const element = result;
    const { children = [], props = {}, type } = element;

    if (typeof type === 'string' || typeof type === 'function') {
      const hasArrayChildren = children.some(child => Array.isArray(child));

      // Fast path: no array children means .flat() is a no-op — reuse the element
      if (!hasArrayChildren) {
        return element;
      }

      const flatChildren = children.flat();

      /** @type {BasicRenderableElement<ElementProps>} */
      const checked = { type, props, children: flatChildren };

      if (element.skipStringEscape) checked.skipStringEscape = true;

      // Re-derive async status after flattening (h() may not have been
      // able to see through array children that .flat() resolves)
      if (typeof type === 'string' && flatChildren.every(child => isSyncChild(child))) {
        checked.async = false;
      }

      return checked;
    }

    throw new TypeError(`Resolved to invalid type of object value "type" property: ${typeof type}`);
  } else {
    throw new TypeError(`Resolved to invalid value type: ${typeof result}`);
  }
};

/**
 * @param {TemplateStringsArray} strings
 * @param  {...HtmlTemplateValue} values
 * @returns {HtmlMethodResult}
 */
export const html = (strings, ...values) => {
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
export const rawHtml = (strings, ...values) => {
  /** @type {RenderableElementFunction<{}>} */
  const type = () => typeof strings === 'string' ? strings : String.raw(strings, ...values);
  return { type, props: {}, children: [], skipStringEscape: true, async: false };
};
