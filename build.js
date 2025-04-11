import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create build directory if it doesn't exist
const buildDir = resolve(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Run Vite build for library
console.log('Building THREE.Terrain library...');
execSync('vite build', { stdio: 'inherit' });

// Copy the output to the build directory
console.log('Copying build files...');
fs.copyFileSync(
  resolve(__dirname, 'dist/three.terrain.js'),
  resolve(__dirname, 'build/THREE.Terrain.js')
);
fs.copyFileSync(
  resolve(__dirname, 'dist/three.terrain.umd.cjs'),
  resolve(__dirname, 'build/THREE.Terrain.min.js')
);

// Build the demo
console.log('Building demo...');
try {
  execSync('vite build --config vite.demo.config.js', { stdio: 'inherit' });
} catch (e) {
  console.warn('Demo build failed, but library build should be complete:', e.message);
}

console.log('Build complete!');