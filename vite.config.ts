import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // CRITICAL: This makes the app load correctly in the Android WebView
  base: './', 
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
