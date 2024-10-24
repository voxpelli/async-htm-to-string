/* eslint-disable regexp/no-useless-range */

// *** REACT BORROWED ***

const ATTRIBUTE_NAME_START_CHAR =
  ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
const ATTRIBUTE_NAME_CHAR =
  // eslint-disable-next-line regexp/prefer-w
  ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040';

// eslint-disable-next-line no-misleading-character-class
const VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');

const VALID_TAG_REGEX = /^[a-z][\w.:-]*$/i; // Simplified subset

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

const omittedCloseTags = /** @type {const} */ ({
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
});

module.exports = {
  isTagValid,
  isAttributeNameValid,
  omittedCloseTags,
};
