/** @type {import('../index.js').HtmlMethodResult} */
export const ELEMENT_FIXTURE = Object.freeze({ type: 'div', props: {}, children: [] });

/** @type {import('../index.js').HtmlMethodResult} */
export const ELEMENT_ARRAY_CHILD_FIXTURE = Object.freeze({
  type: 'ul',
  props: {},
  children: [
    { type: 'li', props: {}, children: ['One'] },
    { type: 'li', props: {}, children: ['Two'] },
  ],
});

export const ELEMENT_FIXTURE_INVALID_TYPE = Object.freeze({ type: true, props: {}, children: [] });

function PrototypeIncludingClass () {
  this.a = 1;
  this.b = 2;
}

// add properties in f function's prototype
PrototypeIncludingClass.prototype.b = 3;
PrototypeIncludingClass.prototype.c = 4;

/** @type {import('../index.js').HtmlMethodResult} */
// @ts-ignore
export const ELEMENT_FIXTURE_WITH_COMPLEX_PROPS = Object.freeze({
  type: 'div',
  props: new PrototypeIncludingClass(),
  children: [],
});
