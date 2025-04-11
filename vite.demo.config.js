import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist/demo',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  // Specify the entry point
  root: './',
  publicDir: './',
}); 