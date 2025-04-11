// Define the Vite environment variables
window.__DEFINES__ = {};

// Import the Vite client for HMR - using a try/catch to avoid breaking when not running with Vite
try {
  // Use a dynamic import for the Vite client to avoid direct dependency resolution issues
  const viteClientUrl = new URL('./node_modules/vite/dist/client/env.mjs', import.meta.url);
  await import(viteClientUrl);
} catch (e) {
  console.warn('Vite client import failed:', e);
}

console.log("Vite client initialized"); 