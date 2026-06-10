import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project under /File-Format-Converter/.
// The `test` branch is published under /File-Format-Converter/test/.
// The base is provided by the deploy workflow via VITE_BASE; falls back to
// the production (main) base for local builds.
const base = process.env.VITE_BASE ?? '/File-Format-Converter/';

export default defineConfig({
  base,
  plugins: [react()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});
