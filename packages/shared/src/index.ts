// Shared barrel — import everything from '@inwealthment/shared'
export type { User, AuthAdapter, AuthEvent } from './auth';
export { useAuth } from './hooks/useAuth';
export type { WatchlistItem, StockQuote, SearchResult, AlertEvent } from './types';
export type { StorageAdapter } from './storage';
export type { StockService } from './services/stockService';
export { createStockService } from './services/stockService';
export { createSupabaseStorageAdapter } from './supabaseStorageAdapter';
export { useWatchlist } from './hooks/useWatchlist';
export { useStockPrices } from './hooks/useStockPrices';
export { formatPrice, formatChange } from './utils/formatPrice';
