import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true,
    fs: {
      allow: [
        resolve(__dirname),
        resolve(__dirname, 'src'),
        resolve(__dirname, 'public'),
        resolve(__dirname, 'demo'),
        resolve(__dirname, 'statistics'),
        resolve(__dirname, 'vendor'),
        resolve(__dirname, 'node_modules'),
      ]
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
  root: './',
  publicDir: 'public',
  resolve: {
    dedupe: ['three']
  }
});
