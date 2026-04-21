import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchQuotes } from '../services/stockService';
import type { StockQuote } from '../types';

export function useStockPrices(symbols: string[], intervalMs = 30000) {
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const symbolsKey = symbols.join(',');

  useEffect(() => {
    if (!symbols.length) return;
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      try {
        const results = await fetchQuotes(symbols);
        if (!cancelled) {
          setQuotes((prev) => {
            const next = new Map(prev);
            results.forEach((q) => next.set(q.symbol, q));
            return next;
          });
          setHasFetched(true);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Failed to fetch prices. Retrying...');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    const id = setInterval(fetchAll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, intervalMs, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { quotes, loading, hasFetched, error, refresh };
}

