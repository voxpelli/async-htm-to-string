const {
  h,
  html,
  rawHtml,
} = require('./lib/htm');

const {
  render,
  renderSync,
  renderToString,
  renderToStringSync,
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
  renderSync,
  renderToString,
  renderToStringSync,
};
