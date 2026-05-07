import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cssPath = resolve('assets/css/vrodos_modern_compiled.css');

let css;

try {
  css = readFileSync(cssPath);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`CSS file not found: ${cssPath}`);
    process.exit(1);
  }

  throw error;
}

const gzip = gzipSync(css, { level: 9 });

console.log(`CSS file: ${cssPath}`);
console.log(`Raw bytes: ${css.length}`);
console.log(`Gzip bytes: ${gzip.length}`);
