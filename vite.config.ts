import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const yahooHeaders = {
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Inwealthment',
        short_name: 'Inwealthment',
        description: 'Track stocks and crypto in real time',
        theme_color: '#0f0f14',
        background_color: '#0f0f14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  server: {
    host: true,
    proxy: {
      '/api/quote': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        headers: yahooHeaders,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const symbol = url.searchParams.get('symbol') ?? '';
          const interval = url.searchParams.get('interval') ?? '1d';
          const range = url.searchParams.get('range') ?? '1d';
          return `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
        },
      },
      '/api/stocksearch': {
        target: 'https://query2.finance.yahoo.com',
        changeOrigin: true,
        headers: yahooHeaders,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          return `/v1/finance/search?${url.searchParams.toString()}`;
        },
      },
    },
  },
})
