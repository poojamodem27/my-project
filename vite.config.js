import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',   // dist folder works on any host (Netlify, GitHub Pages, etc.)
  plugins: [react()],
});
