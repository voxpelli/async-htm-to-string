/// <reference types="node" />
/// <reference types="mocha" />
/// <reference types="chai" />

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const should = chai.should();

const {
  render,
} = require('..');

const {
  ELEMENT_FIXTURE
} = require('./fixtures');

describe('render() basic', () => {
  it('should throw on no argument', async () => {
    await (async () => {
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const _foo of render()) {}
    })()
      .should.be.rejectedWith(TypeError, 'Expected an argument');
  });

  it('should throw on null argument', async () => {
    await (async () => {
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, no-empty, unicorn/no-null
      for await (const _foo of render(null)) {}
    })()
      .should.be.rejectedWith(TypeError, 'Expected a non-falsy argument, got: null');
  });

  it('should throw on empty string argument', async () => {
    await (async () => {
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const _foo of render('')) {}
    })()
      .should.be.rejectedWith(TypeError, 'Expected a non-falsy argument, got: ');
  });

  it('should throw on unsupported argument', async () => {
    await (async () => {
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const _foo of render(true)) {}
    })()
      .should.be.rejectedWith(TypeError, 'Expected a string or an object, got: boolean');
  });

  it('should return an async iterator', async () => {
    const result = render(ELEMENT_FIXTURE);
    should.exist(result);
    (typeof result === 'object').should.be.ok;
    should.exist(result[Symbol.asyncIterator]);
  });

  it('should return sensible values', async () => {
    const total = [];

    for await (const result of render(ELEMENT_FIXTURE)) {
      should.exist(result);

      result.should.be.a('string');
      result.length.should.be.greaterThan(0);

      total.push(result);
    }

    total.should.deep.equal(['<div', '>', '</div>']);
  });
});
