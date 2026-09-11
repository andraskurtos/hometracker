import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Where the dev server proxies API/upload requests. Override with
// VITE_DEV_BACKEND if the backend runs somewhere other than localhost:8000.
const BACKEND = process.env.VITE_DEV_BACKEND ?? 'http://localhost:8000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'HomeTracker',
        short_name: 'HomeTracker',
        description: 'Track and manage your home receipts and expenses.',
        theme_color: '#4DB88A',
        background_color: '#0f1117',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/src/assets/icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/src/assets/icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/src/assets/icon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
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
