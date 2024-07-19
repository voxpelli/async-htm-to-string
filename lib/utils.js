'use strict';

/** @import { IterableIteratorMaybeAsync } from './util-types.d.ts' */

/**
 * @param {unknown} value
 * @returns {value is object}
 */
const isObject = (value) => typeof value === 'object' && value !== null;

/**
 * @param {unknown} value
 * @returns {value is AsyncIterable<unknown>}
 */
const isAsyncIterable = (value) => isObject(value) && Symbol.asyncIterator in value;

/**
 * @param {unknown} value
 * @returns {value is Iterable<unknown>}
 */
const isIterable = (value) => isObject(value) && Symbol.iterator in value;

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

module.exports = {
  isAsyncIterable,
  isIterable,
  generatorToString,
};
