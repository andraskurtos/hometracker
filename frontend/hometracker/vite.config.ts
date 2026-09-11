import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Where the dev server proxies API/upload requests. Override with
// VITE_DEV_BACKEND if the backend runs somewhere other than localhost:8000.
const BACKEND = process.env.VITE_DEV_BACKEND ?? 'http://localhost:8000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Keep dev same-origin, mirroring the production nginx setup: the app calls
    // relative /api and /uploads paths, Vite forwards them to the backend.
    proxy: {
      '/api': BACKEND,
      '/uploads': BACKEND,
    },
  },
})
