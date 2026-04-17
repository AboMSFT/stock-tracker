import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const yahooHeaders = {
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        headers: yahooHeaders,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
      },
      '/api/search': {
        target: 'https://query2.finance.yahoo.com',
        changeOrigin: true,
        headers: yahooHeaders,
        rewrite: (path) => path.replace(/^\/api\/search/, ''),
      },
    },
  },
})
