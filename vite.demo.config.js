import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true,
    fs: {
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
