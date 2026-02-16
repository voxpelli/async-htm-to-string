/**
 * @param {unknown} value
 * @returns {value is object}
 */
const isObject = (value) => typeof value === 'object' && value !== null;

/**
 * @param {unknown} value
 * @returns {value is AsyncIterable<unknown>}
 */
export const isAsyncIterable = (value) => isObject(value) && Symbol.asyncIterator in value;

/**
 * @param {unknown} value
 * @returns {value is Iterable<unknown>}
 */
export const isIterable = (value) => isObject(value) && Symbol.iterator in value;
