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
