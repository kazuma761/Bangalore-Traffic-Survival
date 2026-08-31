import { defineConfig } from 'vite';

export default defineConfig({
  // Vercel serves the app from the domain root. Override with BASE_PATH when
  // deploying somewhere nested, e.g. BASE_PATH=/Banglore-traffic/ for GitHub Pages.
  base: process.env.BASE_PATH ?? '/',
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Three.js is ~85% of the bundle and changes only when the dependency
        // is upgraded. Splitting it out means a gameplay tweak ships a ~15 kB
        // chunk instead of invalidating half a megabyte — which is the whole
        // difference between an instant reload and another cold download on a
        // phone. The vendor chunk keeps its content hash and stays in cache.
        manualChunks: (id: string) =>
          id.includes('node_modules/three') ? 'three' : undefined,
      },
    },
  },
});
