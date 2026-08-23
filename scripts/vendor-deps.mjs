/**
 * Copy runtime dependencies from node_modules into vendor/ for static
 * hosting (GitHub Pages) without a CDN. Run via: npm run vendor
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = join(root, 'vendor');
const nm = join(root, 'node_modules');

async function copy(from, to) {
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to, { recursive: true });
}

async function vendorStats() {
  const src = join(nm, 'stats-js', 'src', 'Stats.js');
  let code = await readFile(src, 'utf8');
  if (!/export\s+default|Stats\s+as\s+default/.test(code)) {
    code += '\nexport default Stats;\n';
  }
  const out = join(vendor, 'stats-js', 'stats.module.mjs');
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, code);
}

async function main() {
  await rm(vendor, { recursive: true, force: true });
  await mkdir(vendor, { recursive: true });

  await copy(
    join(nm, 'three', 'build', 'three.module.js'),
    join(vendor, 'three', 'build', 'three.module.js')
  );
  await copy(
    join(nm, 'three', 'build', 'three.core.js'),
    join(vendor, 'three', 'build', 'three.core.js')
  );
  await copy(
    join(nm, 'three', 'examples', 'jsm', 'controls', 'FirstPersonControls.js'),
    join(vendor, 'three', 'examples', 'jsm', 'controls', 'FirstPersonControls.js')
  );
  await copy(
    join(nm, 'dat.gui', 'build', 'dat.gui.module.js'),
    join(vendor, 'dat.gui', 'build', 'dat.gui.module.js')
  );
  await copy(
    join(nm, 'dat.gui', 'build', 'dat.gui.css'),
    join(vendor, 'dat.gui', 'build', 'dat.gui.css')
  );

  await vendorStats();

  console.log('Vendored dependencies into vendor/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
