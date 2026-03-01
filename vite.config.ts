import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Optional: only if you need Gemini API key in frontend code
  // define: {
  //   'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  // },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  server: {
    port: 1420,     // Tauri expects this port
    host: true,     // Allows localhost access
  },
});