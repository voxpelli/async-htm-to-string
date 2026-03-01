/* eslint-disable camelcase, n/no-sync */
import { bench, boxplot, do_not_optimize, group, run, summary } from 'mitata';

import { html, rawHtml, render, renderToString, renderToStringSync } from './index.js';
import { generatorToString } from './lib/utils.js';

// Simulate the old renderToString (pre-optimization): always goes through
// async generators, no sync fast path. This is what every call did before.
const renderToStringLegacy = (item) => generatorToString(render(item));

// --- Templates ---

const syncSimple = () => html`<div class="hello">Hello World</div>`;

const syncMedium = () => html`
  <div class="container">
    <header>
      <h1>Title</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>
    <main>
      <p>Content here with ${'dynamic'} values</p>
      <img src="photo.jpg" />
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    </main>
    <footer>Footer</footer>
  </div>
`;

const syncWithRawHtml = () => html`
  <div>
    ${rawHtml`<p>Pre-escaped &amp; content</p>`}
    <span>Normal content</span>
  </div>
`;

/** @type {import('./index.js').SimpleRenderableElementFunction} */
const SyncComponent = (_props, children) => html`<div class="wrapper">${children}</div>`;

const withSyncComponent = () => html`<${SyncComponent}><span>Child</span></${SyncComponent}>`;

/** @type {import('./index.js').SimpleRenderableElementFunction} */
const AsyncComponent = async (_props, children) => html`<div class="wrapper">${children}</div>`;

const withAsyncComponent = () => html`<${AsyncComponent}><span>Child</span></${AsyncComponent}>`;

// --- Benchmarks ---

group('simple sync template: <div class="hello">Hello World</div>', () => {
  summary(() => {
    bench('legacy async generators', async () => {
      do_not_optimize(await renderToStringLegacy(syncSimple()));
    }).baseline().gc('inner');

    bench('renderToString (auto fast path)', async () => {
      do_not_optimize(await renderToString(syncSimple()));
    }).gc('inner');

    bench('renderToStringSync', () => {
      do_not_optimize(renderToStringSync(syncSimple()));
    }).gc('inner');
  });
});

group('medium sync template: nested HTML with props, lists, self-closing tags', () => {
  summary(() => {
    bench('legacy async generators', async () => {
      do_not_optimize(await renderToStringLegacy(syncMedium()));
    }).baseline().gc('inner');

    bench('renderToString (auto fast path)', async () => {
      do_not_optimize(await renderToString(syncMedium()));
    }).gc('inner');

    bench('renderToStringSync', () => {
      do_not_optimize(renderToStringSync(syncMedium()));
    }).gc('inner');
  });
});

group('template with rawHtml child', () => {
  summary(() => {
    bench('legacy async generators', async () => {
      do_not_optimize(await renderToStringLegacy(syncWithRawHtml()));
    }).baseline().gc('inner');

    bench('renderToString (auto fast path)', async () => {
      do_not_optimize(await renderToString(syncWithRawHtml()));
    }).gc('inner');

    bench('renderToStringSync', () => {
      do_not_optimize(renderToStringSync(syncWithRawHtml()));
    }).gc('inner');
  });
});

group('sync function component', () => {
  summary(() => {
    bench('legacy async generators', async () => {
      do_not_optimize(await renderToStringLegacy(withSyncComponent()));
    }).baseline().gc('inner');

    bench('renderToString (auto fast path)', async () => {
      do_not_optimize(await renderToString(withSyncComponent()));
    }).gc('inner');

    bench('renderToStringSync', () => {
      do_not_optimize(renderToStringSync(withSyncComponent()));
    }).gc('inner');
  });
});

group('async function component (no sync path possible)', () => {
  summary(() => {
    bench('legacy async generators', async () => {
      do_not_optimize(await renderToStringLegacy(withAsyncComponent()));
    }).baseline().gc('inner');

    bench('renderToString', async () => {
      do_not_optimize(await renderToString(withAsyncComponent()));
    }).gc('inner');
  });
});

boxplot(() => {
  bench('simple - legacy', async () => {
    do_not_optimize(await renderToStringLegacy(syncSimple()));
  }).gc('inner');

  bench('simple - renderToString', async () => {
    do_not_optimize(await renderToString(syncSimple()));
  }).gc('inner');

  bench('simple - renderToStringSync', () => {
    do_not_optimize(renderToStringSync(syncSimple()));
  }).gc('inner');

  bench('medium - legacy', async () => {
    do_not_optimize(await renderToStringLegacy(syncMedium()));
  }).gc('inner');

  bench('medium - renderToString', async () => {
    do_not_optimize(await renderToString(syncMedium()));
  }).gc('inner');

  bench('medium - renderToStringSync', () => {
    do_not_optimize(renderToStringSync(syncMedium()));
  }).gc('inner');

  bench('component - legacy', async () => {
    do_not_optimize(await renderToStringLegacy(withSyncComponent()));
  }).gc('inner');

  bench('component - renderToString', async () => {
    do_not_optimize(await renderToString(withSyncComponent()));
  }).gc('inner');

  bench('component - renderToStringSync', () => {
    do_not_optimize(renderToStringSync(withSyncComponent()));
  }).gc('inner');
});

await run();
