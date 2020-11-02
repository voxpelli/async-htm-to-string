// @ts-check

'use strict';

const { readFile, writeFile } = require('fs').promises;
const pathModule = require('path');

const fileMap = [
  'index.js'
];
(async () => {
  for (const file of fileMap) {
    const filePath = pathModule.resolve(__dirname, file);

    const content = await readFile(filePath, 'utf8');

    let result = content
      .replace(/^(\s*)[^\n/]+(?:\/[^\n/]+)*\/\/ esm-replace-with:\s*([^\n]+)$/gm, '$1$2')
      .replace(/^(\s*)([^\n/]+)\/\/ esm-prefix-with:\s*([^\n]+)$/gm, '$1$3 $2')
      .replace(/^(\s*)[^\n/]+\/\/ esm-remove\n/gm, '')
      .replace(/ +$/gm, '');

    if (/\n$/.test(result) === false) {
      result += '\n';
    }

    await writeFile(filePath.replace(/\.js$/, '.mjs'), result, 'utf8');
  }
})()
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error(err.message, err.stack);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
