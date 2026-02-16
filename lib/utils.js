import { isType } from '@voxpelli/typed-utils';

/**
 * @param {unknown} value
 * @returns {value is AsyncIterable<unknown>}
 */
export const isAsyncIterable = (value) => isType(value, 'object') && Symbol.asyncIterator in value;

/**
 * @param {unknown} value
 * @returns {value is Iterable<unknown>}
 */
export const isIterable = (value) => isType(value, 'object') && Symbol.iterator in value;
