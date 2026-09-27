import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Mirrors the `@/*` path in tsconfig.json. Both are required: Vite needs
    // this to resolve the specifier at build time, and `tsc` needs the other
    // one to type it. Setting only one is the usual cause of "cannot find
    // module '@/lib/utils'" in a project that otherwise looks correct.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Keeps the Gemini API key on the server: the browser calls same-origin
    // /api/* and Vite forwards to the Express proxy in server/index.ts.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
