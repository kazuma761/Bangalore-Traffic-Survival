import { defineConfig } from 'vite';

export default defineConfig({
  // Vercel serves the app from the domain root. Override with BASE_PATH when
  // deploying somewhere nested, e.g. BASE_PATH=/Banglore-traffic/ for GitHub Pages.
  base: process.env.BASE_PATH ?? '/',
  build: {
    target: 'es2022',
  },
});
