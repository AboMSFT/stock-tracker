export interface WatchlistItem {
  symbol: string;
  companyName: string;
  assetType?: 'stock' | 'crypto';
  targetPrice?: number;
  alertDirection?: 'above' | 'below';
  alertFired?: boolean;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  companyName: string;
  currency: string;
  sparkline?: number[];
}

export interface SearchResult {
  symbol: string;
  shortname: string;
  longname?: string;
  typeDisp?: string;
  exchDisp?: string;
  assetType?: 'stock' | 'crypto';
}

export interface AlertEvent {
  id: string;
  symbol: string;
  companyName: string;
  price: number;
  targetPrice: number;
}
