import { stringifyEntities } from 'stringify-entities';

import { isAttributeNameValid } from './validation.js';

/**
 * Renders HTML element attributes to strings.
 * Based on React's DOMMarkupOperations.
 *
 * @see https://github.com/facebook/react/blob/779a472b0901b2d28e382f3850b2ad09a555b014/packages/react-dom/src/server/DOMMarkupOperations.js#L48-L72
 * @yields {string}
 * @param {Record<string, unknown>} props
 * @returns {AsyncIterableIterator<string>}
 */
export async function * renderProps (props) {
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
}
