import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  server: {
    open: true,
    fs: {
      // Allow serving files from demo, src, and node_modules
      allow: ['demo', 'src', 'node_modules']
    }
  },
  build: {
    outDir: 'dist/demo',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  // Specify the entry point
  root: './',
  publicDir: 'demo',
  resolve: {
    alias: {
      'three': 'three',
      'three/examples/': 'three/examples/'
    }
  },
  optimizeDeps: {
    include: ['three', 'dat.gui']
  }
}); 