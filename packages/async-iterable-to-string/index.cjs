'use strict';

/**
 * Asyncly concatenates an iterable (sync or async) of strings into a single string.
 *
 * @param {AsyncIterable<string>|Iterable<string>} generator
 * @returns {Promise<string>}
 */
const generatorToString = async (generator) => {
  let result = '';
  for await (const item of generator) {
    result += item;
  }
  return result;
};

module.exports = { generatorToString };
