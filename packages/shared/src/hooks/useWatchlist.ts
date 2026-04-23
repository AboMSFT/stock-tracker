import { useState, useCallback, useEffect, useRef } from 'react';
import type { StorageAdapter } from '../storage';
import type { WatchlistItem } from '../types';

const STORAGE_KEY = 'inwealthment-watchlist';

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  result.splice(to, 0, result.splice(from, 1)[0]);
  return result;
}

export function useWatchlist(storage: StorageAdapter) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // Track whether a save is in-flight so we serialize writes.
  const saveRef = useRef<Promise<void>>(Promise.resolve());

  // Load watchlist from storage once on mount.
  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((raw) => {
      setItems(raw ? (JSON.parse(raw) as WatchlistItem[]) : []);
      setHydrated(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever items change — but only after initial hydration so we
  // never overwrite storage with the empty initial state.
  useEffect(() => {
    if (!hydrated) return;
    // Chain saves so concurrent mutations write in order (latest wins).
    saveRef.current = saveRef.current.then(() =>
      storage.setItem(STORAGE_KEY, JSON.stringify(items))
    );
  }, [items, hydrated, storage]);

  const addStock = useCallback(
    (symbol: string, companyName: string, assetType: 'stock' | 'crypto' = 'stock') => {
      if (!hydrated) return;
      setItems((prev) => {
        if (prev.find((i) => i.symbol === symbol)) return prev;
        return [...prev, { symbol, companyName, assetType }];
      });
    },
    [hydrated]
  );

  const removeStock = useCallback(
    (symbol: string) => {
      if (!hydrated) return;
      setItems((prev) => prev.filter((i) => i.symbol !== symbol));
    },
    [hydrated]
  );

  const setTargetPrice = useCallback(
    (symbol: string, targetPrice: number | undefined, currentPrice?: number) => {
      if (!hydrated) return;
      setItems((prev) =>
        prev.map((i) => {
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
        })
      );
    },
    [hydrated]
  );

  const clearAll = useCallback(() => {
    if (!hydrated) return;
    setItems([]);
  }, [hydrated]);

  const markAlertFired = useCallback(
    (symbol: string) => {
      if (!hydrated) return;
      setItems((prev) =>
        prev.map((i) =>
          i.symbol === symbol ? { ...i, alertFired: true, alertDirection: undefined } : i
        )
      );
    },
    [hydrated]
  );

  const reorderStocks = useCallback(
    (activeId: string, overId: string) => {
      if (!hydrated || !activeId || !overId || activeId === overId) return;
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.symbol === activeId);
        const newIndex = prev.findIndex((i) => i.symbol === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    },
    [hydrated]
  );

  const reorderAll = useCallback(
    (symbolOrder: string[]) => {
      if (!hydrated) return;
      setItems((prev) => {
        const map = new Map(prev.map((i) => [i.symbol, i]));
        return symbolOrder.map((s) => map.get(s)).filter(Boolean) as WatchlistItem[];
      });
    },
    [hydrated]
  );

  return { items, hydrated, addStock, removeStock, setTargetPrice, markAlertFired, reorderStocks, reorderAll, clearAll };
}
