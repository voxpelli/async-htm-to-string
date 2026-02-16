import { readFile, writeFile } from 'node:fs/promises';

const content = await readFile('index.d.ts', 'utf8');
await writeFile('index.d.ts', "export type * from './lib/element-types.d.ts';\n\n" + content);
