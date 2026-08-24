/**
 * Build the vendored Eztree source into one browser-ready ES module.
 *
 * The source package uses extensionless imports and JSON modules. Those are
 * convenient for a bundler, but they are not reliable when GitHub Pages
 * serves the source tree directly. Vite resolves those imports at build time
 * and emits a single module with the preset data and texture assets bundled.
 */
import { build } from 'vite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

await build({
  configFile: false,
  root,
  build: {
    lib: {
      entry: join(root, 'vendor/eztree/lib/index.js'),
      formats: ['es'],
      fileName: () => 'eztree.module.js',
    },
    outDir: join(root, 'vendor/eztree/build'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      external: ['three'],
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
