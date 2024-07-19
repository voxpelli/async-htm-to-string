const {
  h,
  html,
  rawHtml,
} = require('./lib/htm');

const {
  render,
  renderToString,
} = require('./lib/render');

const {
  generatorToString,
} = require('./lib/utils');

module.exports = {
  generatorToString,
  h,
  html,
  rawHtml,
  render,
  renderToString,
};
