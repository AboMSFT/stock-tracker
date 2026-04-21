import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { WatchlistItem } from '../types';

const STORAGE_KEY = 'inwealthment-watchlist';

function loadFromStorage(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: WatchlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(loadFromStorage);

  const addStock = useCallback((symbol: string, companyName: string, assetType: 'stock' | 'crypto' = 'stock') => {
    setItems((prev) => {
      if (prev.find((i) => i.symbol === symbol)) return prev;
      const updated = [...prev, { symbol, companyName, assetType }];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeStock = useCallback((symbol: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.symbol !== symbol);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const setTargetPrice = useCallback(
    (symbol: string, targetPrice: number | undefined, currentPrice?: number) => {
      setItems((prev) => {
        const updated = prev.map((i) => {
          if (i.symbol !== symbol) return i;
          if (targetPrice === undefined) {
            const { targetPrice: _tp, alertDirection: _ad, alertFired: _af, ...rest } = i;
            return rest;
          }
          const alertDirection: WatchlistItem['alertDirection'] =
            currentPrice !== undefined
              ? currentPrice < targetPrice
                ? 'above'
                : 'below'
              : undefined;
          return { ...i, targetPrice, alertDirection, alertFired: false };
        });
        saveToStorage(updated);
        return updated;
      });
    },
    []
  );

const clearAll = useCallback(() => {
     setItems([]);
     saveToStorage([]);
 }, []);

  const markAlertFired = useCallback((symbol: string) => {
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.symbol === symbol ? { ...i, alertFired: true, alertDirection: undefined } : i
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const reorderStocks = useCallback((activeId: string, overId: string) => {
    if (!activeId || !overId || activeId === overId) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.symbol === activeId);
      const newIndex = prev.findIndex((i) => i.symbol === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
      const updated = arrayMove(prev, oldIndex, newIndex);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { items, addStock, removeStock, setTargetPrice, markAlertFired, reorderStocks, clearAll };
}
