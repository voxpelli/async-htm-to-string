# @voxpelli/html-render-utils

Utilities for rendering HTML elements and attributes. Extracted from [async-htm-to-string](https://github.com/voxpelli/async-htm-to-string).

## API

### `isTagValid(tag)`

Validates that a tag name is safe for HTML rendering.

### `isAttributeNameValid(name)`

Validates that an attribute name is valid per HTML spec.

### `omittedCloseTags`

Object mapping self-closing HTML tag names (e.g. `br`, `img`) to `true`.

### `renderProps(props)`

Async generator that yields escaped HTML attribute strings from a props object.

### `renderStringItem(item, renderChildren)`

Async generator that renders a string-typed HTML element. Accepts a `renderChildren` callback to render child content.

## License

0BSD
