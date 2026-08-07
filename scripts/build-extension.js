//
// Copies public/ into chrome_ext/app/ so the extension ships the real app
// instead of iframing a remote URL.
//
// The old popup pointed at a hosted page, which meant the extension needed a
// network connection to show a calculator that does no networking, and broke
// outright when the hosted URL moved. Bundling removes both problems.
//
// chrome_ext/app/ is generated and gitignored — public/ stays the only source.
//

import { cp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'public');
const target = join(root, 'chrome_ext', 'app');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

// A service worker cannot register on the chrome-extension: scheme, and the
// extension is already local, so the file is redundant inside the bundle.
await rm(join(target, 'sw.js'), { force: true });

// Keep the extension's version in step with package.json.
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const manifestPath = join(root, 'chrome_ext', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

if (manifest.version !== pkg.version) {
  manifest.version = pkg.version;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(`Bundled public/ -> chrome_ext/app/ (manifest version ${manifest.version})`);
