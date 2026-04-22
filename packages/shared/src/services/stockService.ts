import type { StockQuote, SearchResult } from '../types';

export interface StockService {
  fetchQuotes(symbols: string[]): Promise<StockQuote[]>;
  searchStocks(query: string): Promise<SearchResult[]>;
}

export function createStockService(baseUrl = ''): StockService {
  async function fetchSingleQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const res = await fetch(
        `${baseUrl}/api/quote?symbol=${encodeURIComponent(symbol)}&interval=5m&range=1d`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta) return null;

      const price: number = meta.regularMarketPrice ?? 0;
      const prevClose: number = meta.chartPreviousClose ?? price;
      const change = price - prevClose;
      const changePercent = prevClose ? (change / prevClose) * 100 : 0;

      const rawClose: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
      const sparkline = rawClose.filter((v): v is number => v !== null && isFinite(v));

      return {
        symbol: meta.symbol ?? symbol,
        price,
        change,
        changePercent,
        companyName: meta.shortName ?? meta.longName ?? symbol,
        currency: meta.currency ?? 'USD',
        sparkline: sparkline.length >= 2 ? sparkline : undefined,
      };
    } catch {
      return null;
    }
  }

  async function fetchQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (!symbols.length) return [];
    const results = await Promise.allSettled(symbols.map(fetchSingleQuote));
    return results
      .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value);
  }

  async function searchStocks(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    const res = await fetch(
      `${baseUrl}/api/stocksearch?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`
    );
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    const quotes: any[] = data?.quotes ?? [];
    return quotes
      .filter((q) => ['EQUITY', 'ETF', 'INDEX', 'CRYPTOCURRENCY'].includes(q.quoteType))
      .map((q): SearchResult => ({
        symbol: q.symbol,
        shortname: q.shortname ?? q.symbol,
        longname: q.longname,
        typeDisp: q.typeDisp,
        exchDisp: q.exchDisp,
        assetType: q.quoteType === 'CRYPTOCURRENCY' ? 'crypto' : 'stock',
      }));
  }

  return { fetchQuotes, searchStocks };
}
