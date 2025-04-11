const { defineConfig } = require('vite');
const topLevelAwait = require('vite-plugin-top-level-await');
const wasm = require('vite-plugin-wasm');

module.exports = defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  // Specify the entry point
  root: './',
  publicDir: './',
});
