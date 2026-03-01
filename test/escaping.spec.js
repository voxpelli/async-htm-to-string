/* eslint-disable n/no-sync */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  html,
  rawHtml,
  renderToString,
  renderToStringSync,
} from '../index.js';

// ---------------------------------------------------------------------------
// HTML escaping tests
//
// This library uses an inline escapeHtml() that replaces the 6 HTML-dangerous
// characters: & < > " ' `
//
// This is equivalent to stringify-entities with { escapeOnly: true,
// useNamedReferences: true } — that configuration ONLY escapes these 6 chars
// and skips all surrogate-pair / control-character processing (verified via
// stringify-entities source: lib/core.js returns early when escapeOnly is set).
//
// These tests provide comprehensive coverage to verify correctness of the
// inline implementation, including XSS vectors, Unicode pass-through, and
// parity between async and sync render paths.
// ---------------------------------------------------------------------------

describe('HTML escaping', () => {
  describe('the six dangerous characters', () => {
    it('should escape ampersand', async () => {
      assert.equal(await renderToString(html`<div>${'a&b'}</div>`), '<div>a&amp;b</div>');
    });

    it('should escape less-than', async () => {
      assert.equal(await renderToString(html`<div>${'a<b'}</div>`), '<div>a&lt;b</div>');
    });

    it('should escape greater-than', async () => {
      assert.equal(await renderToString(html`<div>${'a>b'}</div>`), '<div>a&gt;b</div>');
    });

    it('should escape double-quote', async () => {
      assert.equal(await renderToString(html`<div>${'a"b'}</div>`), '<div>a&quot;b</div>');
    });

    it('should escape single-quote', async () => {
      assert.equal(await renderToString(html`<div>${"a'b"}</div>`), '<div>a&#x27;b</div>');
    });

    it('should escape backtick', async () => {
      assert.equal(await renderToString(html`<div>${'a`b'}</div>`), '<div>a&#x60;b</div>');
    });

    it('should escape all six together', async () => {
      const all = '&<>"\'`';
      assert.equal(await renderToString(html`<div>${all}</div>`), '<div>&amp;&lt;&gt;&quot;&#x27;&#x60;</div>');
    });
  });

  describe('text content escaping', () => {
    it('should leave safe content untouched', async () => {
      const safe = 'Hello, World! 123 abc-def_ghi (test) [ok] {fine} @at #hash $dollar %percent ^caret ~tilde';
      assert.equal(await renderToString(html`<div>${safe}</div>`), `<div>${safe}</div>`);
    });

    it('should handle empty string', async () => {
      assert.equal(await renderToString(html`<div>${''}</div>`), '<div></div>');
    });

    it('should handle strings with only special characters', async () => {
      assert.equal(await renderToString(html`<div>${'<<<>>>'}</div>`), '<div>&lt;&lt;&lt;&gt;&gt;&gt;</div>');
    });

    it('should handle mixed safe and unsafe content', async () => {
      const mixed = 'Hello <world> & "friends" it\'s a `test`';
      assert.equal(
        await renderToString(html`<div>${mixed}</div>`),
        '<div>Hello &lt;world&gt; &amp; &quot;friends&quot; it&#x27;s a &#x60;test&#x60;</div>'
      );
    });

    it('should not double-escape already-escaped entities', async () => {
      const alreadyEscaped = '&amp; &lt; &gt; &quot;';
      assert.equal(
        await renderToString(html`<div>${alreadyEscaped}</div>`),
        '<div>&amp;amp; &amp;lt; &amp;gt; &amp;quot;</div>'
      );
    });

    it('should handle special chars at string boundaries', async () => {
      assert.equal(await renderToString(html`<div>${'&start'}</div>`), '<div>&amp;start</div>');
      assert.equal(await renderToString(html`<div>${'end&'}</div>`), '<div>end&amp;</div>');
      assert.equal(await renderToString(html`<div>${'&'}</div>`), '<div>&amp;</div>');
    });

    it('should handle consecutive special characters', async () => {
      const input = '&&<<>>""\'\'``';
      assert.equal(
        await renderToString(html`<div>${input}</div>`),
        '<div>&amp;&amp;&lt;&lt;&gt;&gt;&quot;&quot;&#x27;&#x27;&#x60;&#x60;</div>'
      );
    });
  });

  describe('attribute value escaping', () => {
    it('should escape all six dangerous chars in attributes', async () => {
      const special = '&<>"\'`';
      assert.equal(
        await renderToString(html`<div title="${special}" />`),
        '<div title="&amp;&lt;&gt;&quot;&#x27;&#x60;"></div>'
      );
    });

    it('should escape backtick in attributes', async () => {
      const result = await renderToString(html`<div title="${'`val`'}" />`);
      assert.ok(result.includes('&#x60;val&#x60;'), 'backticks should be escaped in attributes');
    });

    it('should leave safe attribute values untouched', async () => {
      assert.equal(await renderToString(html`<div title="hello world 123" />`), '<div title="hello world 123"></div>');
    });
  });

  describe('whitespace and control characters (pass-through)', () => {
    it('should pass through newlines and tabs', async () => {
      const content = 'line1\nline2\ttab\r\nwindows';
      assert.equal(await renderToString(html`<div>${content}</div>`), `<div>${content}</div>`);
    });

    it('should pass through null character', async () => {
      const content = 'a\0b';
      assert.equal(await renderToString(html`<div>${content}</div>`), '<div>a\0b</div>');
    });

    it('should pass through C0 control characters (hex escapes)', async () => {
      // escapeOnly mode does not encode control chars — same as stringify-entities
      // eslint-disable-next-line unicorn/no-hex-escape -- hex form is idiomatic for control chars
      const content = '\x01\x02\x03\x1F';
      assert.equal(await renderToString(html`<div>${content}</div>`), `<div>${content}</div>`);
    });

    it('should pass through C0 control characters (unicode escapes)', async () => {
      const content = '\u0001\u0002\u0003\u001F';
      assert.equal(await renderToString(html`<div>${content}</div>`), `<div>${content}</div>`);
    });
  });

  describe('Unicode pass-through', () => {
    it('should pass through common non-ASCII characters', async () => {
      const unicode = '\u00E9\u00E0\u00FC\u00F1\u00A9\u00AE\u2122';
      assert.equal(await renderToString(html`<div>${unicode}</div>`), `<div>${unicode}</div>`);
    });

    it('should pass through emoji (astral plane)', async () => {
      const emoji = '\u{1F600}\u{1F4A9}\u{1F680}';
      assert.equal(await renderToString(html`<div>${emoji}</div>`), `<div>${emoji}</div>`);
    });

    it('should pass through CJK characters', async () => {
      const cjk = '\u4E16\u754C\u4F60\u597D';
      assert.equal(await renderToString(html`<div>${cjk}</div>`), `<div>${cjk}</div>`);
    });

    it('should pass through valid surrogate pairs', async () => {
      const surrogates = '\uD834\uDF06';
      assert.equal(await renderToString(html`<div>${surrogates}</div>`), `<div>${surrogates}</div>`);
    });

    it('should pass through lone surrogates (escapeOnly does not process them)', async () => {
      const loneSurrogate = '\uD800';
      assert.equal(await renderToString(html`<div>${loneSurrogate}</div>`), `<div>${loneSurrogate}</div>`);
    });
  });

  describe('XSS prevention', () => {
    it('should neutralize script tags in content', async () => {
      const xss = '<script>alert("xss")</script>';
      assert.equal(
        await renderToString(html`<div>${xss}</div>`),
        '<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>'
      );
    });

    it('should neutralize attribute breakout attempts', async () => {
      const xss = '"><script>alert("xss")</script><"';
      const result = await renderToString(html`<div title="${xss}" />`);
      assert.ok(result.includes('&quot;&gt;&lt;script&gt;'), 'attribute breakout should be escaped');
    });

    it('should neutralize event handler content injection', async () => {
      const xss = 'alert(`xss`)';
      assert.equal(
        await renderToString(html`<div onclick="${xss}" />`),
        '<div onclick="alert(&#x60;xss&#x60;)"></div>'
      );
    });

    it('should neutralize img onerror injection', async () => {
      const xss = '<img src=x onerror="alert(1)">';
      assert.equal(
        await renderToString(html`<div>${xss}</div>`),
        '<div>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</div>'
      );
    });

    it('should neutralize nested template injection', async () => {
      // eslint-disable-next-line no-template-curly-in-string
      const xss = '${alert(1)}';
      // eslint-disable-next-line no-template-curly-in-string
      assert.equal(await renderToString(html`<div>${xss}</div>`), '<div>${alert(1)}</div>');
    });
  });

  describe('rawHtml bypass', () => {
    it('should not escape rawHtml template literal', async () => {
      assert.equal(
        await renderToString(rawHtml`<div>${'&quot;bar&quot;'}&lt;div&gt;ab&amp;c</div>`),
        '<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>'
      );
    });

    it('should not escape rawHtml() string call', async () => {
      assert.equal(
        await renderToString(rawHtml('<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>')),
        '<div>&quot;bar&quot;&lt;div&gt;ab&amp;c</div>'
      );
    });

    it('should not escape rawHtml as child of html element', async () => {
      assert.equal(
        await renderToString(html`<div>${'<div>'}${rawHtml`<div>`}${rawHtml('<div>')}</div>`),
        '<div>&lt;div&gt;<div><div></div>'
      );
    });

    it('should not escape rawHtml as top-level html expression', async () => {
      assert.equal(await renderToString(html`${rawHtml('<b>bold</b>')}`), '<b>bold</b>');
    });

    it('should not escape rawHtml template as top-level html expression', async () => {
      assert.equal(await renderToString(html`${rawHtml`<b>bold</b>`}`), '<b>bold</b>');
    });
  });

  describe('sync path parity', () => {
    it('should escape all six characters identically in sync path', () => {
      const special = '&<>"\'`';
      assert.equal(renderToStringSync(html`<div>${special}</div>`), '<div>&amp;&lt;&gt;&quot;&#x27;&#x60;</div>');
    });

    it('should escape script injection identically in sync path', () => {
      const xss = '<script>alert("xss")</script>';
      assert.equal(
        renderToStringSync(html`<div>${xss}</div>`),
        '<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>'
      );
    });

    it('should escape attribute values identically in sync path', () => {
      const special = '&<>"\'`';
      assert.equal(renderToStringSync(html`<div title="${special}" />`), '<div title="&amp;&lt;&gt;&quot;&#x27;&#x60;"></div>');
    });

    it('should pass through unicode identically in sync path', () => {
      const unicode = '\u00E9\u00E0\u00FC \u{1F600} \u4E16\u754C';
      assert.equal(renderToStringSync(html`<div>${unicode}</div>`), `<div>${unicode}</div>`);
    });

    it('should not double-escape in sync path', () => {
      const alreadyEscaped = '&amp; &lt;';
      assert.equal(renderToStringSync(html`<div>${alreadyEscaped}</div>`), '<div>&amp;amp; &amp;lt;</div>');
    });
  });
});
