'use strict';

(async () => {
  await require('linemod-core').linemod(['index.js'], { outputExtension: '.mjs' });
})()
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error(err.message, err.stack);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
