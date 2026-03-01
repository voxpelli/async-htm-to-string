// Inline HTML escaper — replaces stringify-entities for performance.
//
// With { escapeOnly: true }, stringify-entities only escapes these 6 characters
// and skips all surrogate-pair / control-character processing (its core.js
// returns early when escapeOnly is set). Our inline version is functionally
// equivalent but avoids per-call option allocation and generic dispatch,
// which dominated render time for text-heavy templates.
// See test/escaping.spec.js for comprehensive coverage.

/** @type {Record<string, string>} */
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;' };
const ESCAPE_RE = /[&<>"'`]/g;

/**
 * @param {string} str
 * @returns {string}
 */
export const escapeHtml = (str) => str.replaceAll(ESCAPE_RE, (ch) => {
  const escaped = ESCAPE_MAP[ch];
  /* c8 ignore next -- defensive: ESCAPE_RE and ESCAPE_MAP are synchronized */
  if (escaped === undefined) throw new TypeError(`escapeHtml: unexpected character: ${ch}`);
  return escaped;
});
