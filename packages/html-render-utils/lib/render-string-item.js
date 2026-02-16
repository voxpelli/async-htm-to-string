import { isTagValid, omittedCloseTags } from './validation.js';
import { renderProps } from './render-props.js';

/**
 * Renders a string-typed HTML element (e.g. <div>, <span>) to strings.
 * Uses the provided renderChildren callback to render child content.
 *
 * @yields {string}
 * @template {Record<string, unknown>} Props
 * @param {{ type: string, props: Props, children: unknown[] }} item
 * @param {(children: unknown[]) => AsyncIterableIterator<string>} renderChildren
 * @returns {AsyncIterableIterator<string>}
 */
export async function * renderStringItem (item, renderChildren) {
  const { children, props, type } = item;

  const tag = type.toLowerCase();

  if (type in omittedCloseTags) {
    yield `<${tag}`;
    yield * renderProps(props);
    yield ' />';
  } else if (!isTagValid(tag)) {
    throw new Error(`Invalid tag name: ${tag}`);
  } else {
    yield `<${tag}`;
    yield * renderProps(props);
    yield '>';
    yield * renderChildren(children);
    yield `</${tag}>`;
  }
}
