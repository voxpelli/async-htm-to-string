'use strict';

/** @type {import('..').BasicRenderableElement} */
const ELEMENT_FIXTURE = Object.freeze({ type: 'div', props: {}, children: [] });

const PrototypeIncludingClass = function () {
  this.a = 1;
  this.b = 2;
};

// add properties in f function's prototype
PrototypeIncludingClass.prototype.b = 3;
PrototypeIncludingClass.prototype.c = 4;

/** @type {import('..').BasicRenderableElement} */
const ELEMENT_FIXTURE_WITH_COMPLEX_PROPS = Object.freeze({
  type: 'div',
  props: new PrototypeIncludingClass(),
  children: [],
});

module.exports = {
  ELEMENT_FIXTURE,
  ELEMENT_FIXTURE_WITH_COMPLEX_PROPS,
};
