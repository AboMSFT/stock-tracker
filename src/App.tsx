import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Bell, CopyX } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useWatchlist } from './hooks/useWatchlist';
import { useStockPrices } from './hooks/useStockPrices';
import { StockTile } from './components/StockTile';
import { SearchModal } from './components/SearchModal';
import { AlertBanner } from './components/AlertBanner';
import { playAlertSound } from './utils/audio';
import { sendNotification, requestNotificationPermission } from './utils/notifications';
import type { AlertEvent } from './types';

export default function App() {
  const { items, addStock, removeStock, setTargetPrice, markAlertFired, reorderStocks, clearAll } = useWatchlist();
  const symbols = items.map((i) => i.symbol);
  const { quotes, loading, hasFetched, error } = useStockPrices(symbols, 30000);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderStocks(String(active.id), String(over.id));
    }
  }

  const [showSearch, setShowSearch] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<AlertEvent[]>([]);
  const [notifGranted, setNotifGranted] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    requestNotificationPermission().then(setNotifGranted);
  }, []);

  // Check alerts whenever quotes update
  useEffect(() => {
    if (!quotes.size) return;
    items.forEach((item) => {
      if (!item.targetPrice || !item.alertDirection || item.alertFired) return;
      const quote = quotes.get(item.symbol);
      if (!quote) return;

      const hit =
        (item.alertDirection === 'above' && quote.price >= item.targetPrice) ||
        (item.alertDirection === 'below' && quote.price <= item.targetPrice);

      if (hit) {
        markAlertFired(item.symbol);
        const alertEvent: AlertEvent = {
          id: `${item.symbol}-${Date.now()}`,
          symbol: item.symbol,
          companyName: item.companyName,
          price: quote.price,
          targetPrice: item.targetPrice,
        };
        setActiveAlerts((prev) => [...prev, alertEvent]);
        sendNotification(
          `🎯 ${item.symbol} target reached!`,
          `${item.companyName} is at $${quote.price.toFixed(2)} (target: $${item.targetPrice.toFixed(2)})`
        );
        playAlertSound();
      }
    });
    setLastRefresh(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes]);

  const dismissAlert = useCallback((id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="title-icon">🤑🚀</span> Inwealthment
          </h1>
          <span className="refresh-time">
            {loading ? (
              <RefreshCw size={12} className="spin" />
            ) : (
              lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            )}
          </span>
        </div>
        <div className="header-right">
          {!notifGranted && (
            <button className="notif-btn" onClick={handleRequestNotif} title="Enable notifications">
              <Bell size={18} />
            </button>
          )}
          <button className="icon-btn" onClick={() => setShowSearch(true)} aria-label="Add stock">
            <Plus size={22} />
          </button>
        </div>
      </header>

      <AlertBanner alerts={activeAlerts} onDismiss={dismissAlert} />

      {error && <div className="error-bar">{error}</div>}

      <main className="main-content">
        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <p className="empty-title">Your watchlist is empty</p>
            <p className="empty-sub">Tap the + button to add stocks</p>
            <button className="empty-add-btn" onClick={() => setShowSearch(true)}>
              <Plus size={16} /> Add your first stock
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={symbols} strategy={rectSortingStrategy}>
              <div className="tiles-grid">
                {items.map((item) => (
                  <StockTile
                    key={item.symbol}
                    item={item}
                    quote={quotes.get(item.symbol)}
                    hasFetched={hasFetched}
                    onRemove={removeStock}
                    onSetTarget={setTargetPrice}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onAdd={addStock}
          existingSymbols={symbols}
        />
      )}

      <footer className="bottom-bar">
        <span className="bottom-bar-count">Watching {items.length} stocks</span>
        <button className="icon-btn icon-btn--danger" onClick={clearAll} aria-label="Clear All">
          <CopyX size={20} />
        </button>
      </footer>
    </div>
  );
}
