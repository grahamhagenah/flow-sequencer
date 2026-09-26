import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the built app works wherever it's served from,
  // including a GitHub Pages project path like /om/. The app has no routes of
  // its own (flows live in the URL hash), so nothing else depends on the base.
  base: './',
  // Two pages: the app, and /poses/ (every drawing, to download).
  build: {
    rollupOptions: {
      input: { main: 'index.html', poses: 'poses/index.html' },
    },
  },
});
