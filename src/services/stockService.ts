import type { StockQuote, SearchResult } from '../types';

async function fetchSingleQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `/api/quote?symbol=${encodeURIComponent(symbol)}&interval=1d&range=1d`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price: number = meta.regularMarketPrice ?? 0;
    const prevClose: number = meta.chartPreviousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    return {
      symbol: meta.symbol ?? symbol,
      price,
      change,
      changePercent,
      companyName: meta.shortName ?? meta.longName ?? symbol,
      currency: meta.currency ?? 'USD',
    };
  } catch {
    return null;
  }
}

export async function fetchQuotes(symbols: string[]): Promise<StockQuote[]> {
  if (!symbols.length) return [];
  const results = await Promise.allSettled(symbols.map(fetchSingleQuote));
  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `/api/stocksearch?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`
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
