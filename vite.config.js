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
      // Allow serving files from src, public, demo, and node_modules
      allow: ['src', 'public', 'demo', 'node_modules']
    }
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'THREE.Terrain',
      fileName: 'three.terrain'
    },
    rollupOptions: {
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        }
      }
    }
  },
  define: {
    '__DEFINES__': '{}',
    'global': 'window'
  },
  optimizeDeps: {
    include: [
      'three', 
      'three/examples/jsm/controls/FirstPersonControls.js',
      'stats-js',
      'dat.gui'
    ]
  },
  // Specify the entry point
  root: './',
  publicDir: 'public',
  
  // Enable proper resolution of Node modules
  resolve: {
    dedupe: ['three']
  }
});
