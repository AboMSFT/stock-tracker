import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, RefreshCw, Bell, CopyX, ArrowDown, LogOut } from 'lucide-react';
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
import { useWatchlist, useStockPrices, formatPrice, useAuth, createSupabaseStorageAdapter } from '@inwealthment/shared';
import type { AlertEvent, User } from '@inwealthment/shared';
import { stockService } from './services/stockServiceInstance';
import { webAuthAdapter } from './authAdapter';
import { supabase } from './supabase';
import { StockTile } from './components/StockTile';
import { SearchModal } from './components/SearchModal';
import { AlertBanner } from './components/AlertBanner';
import { InstallBanner } from './components/InstallBanner';
import { AuthScreen } from './components/auth/AuthScreen';
import { playAlertSound } from './utils/audio';
import { sendNotification, requestNotificationPermission } from './utils/notifications';

export default function App() {
  const { user, loading: authLoading, authEvent, signOut, signUp, signIn, resetPassword, updatePassword } = useAuth(webAuthAdapter);

  // Supabase-backed storage – stable reference per user so useWatchlist doesn't re-save on every render.
  const storageAdapter = useMemo(
    () => createSupabaseStorageAdapter(supabase, user?.id ?? ''),
    [user?.id]
  );

  // One-time migration: copy localStorage watchlist → Supabase then remove local copy.
  useEffect(() => {
    if (!user?.id) return;
    const key = `inwealthment-watchlist:${user.id}`;
    const legacyRaw = localStorage.getItem(key);
    if (!legacyRaw) return;
    supabase
      .from('user_storage')
      .upsert(
        { user_id: user.id, key, value: legacyRaw, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      )
      .then(({ error }) => {
        if (!error) localStorage.removeItem(key);
      });
  }, [user?.id]);

  const { items, addStock, removeStock, setTargetPrice, markAlertFired, reorderStocks, clearAll } = useWatchlist(storageAdapter, user?.id ?? '');
  const symbols = items.map((i) => i.symbol);
  const { quotes, loading, hasFetched, error, refresh } = useStockPrices(symbols, stockService, 30000);

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
          `${item.companyName} is at ${formatPrice(quote.price, quote.currency)} (target: ${formatPrice(item.targetPrice, quote.currency)})`
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

  // Pull-to-refresh
  const PULL_THRESHOLD = 70;
  const mainRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);

  function handleTouchStart(e: React.TouchEvent) {
    if ((mainRef.current?.scrollTop ?? 0) === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isPulling.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD));
    } else {
      setPullDistance(0);
      isPulling.current = false;
    }
  }

  function handleTouchEnd() {
    if (pullDistance >= PULL_THRESHOLD) refresh();
    setPullDistance(0);
    isPulling.current = false;
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text-secondary)' }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(_u: User) => {}}
        authEvent={authEvent}
        signUp={signUp}
        signIn={signIn}
        resetPassword={resetPassword}
        updatePassword={updatePassword}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="title-icon">🤑🚀</span> Inwealthment
          </h1>
          <button className="refresh-time" onClick={refresh} title="Refresh prices">
            {loading ? (
              <RefreshCw size={12} className="spin" />
            ) : (
              <><RefreshCw size={12} /> {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
            )}
          </button>
        </div>
        <div className="header-right">
          {!notifGranted && (
            <button className="notif-btn" onClick={handleRequestNotif} title="Enable notifications">
              <Bell size={18} />
            </button>
          )}
          <button className="icon-btn icon-btn--ghost" onClick={signOut} aria-label="Sign out" title="Sign out" style={{ background: 'var(--surface2)' }}>
            <LogOut size={18} />
          </button>
          <button className="icon-btn" onClick={() => setShowSearch(true)} aria-label="Add stock">
            <Plus size={22} />
          </button>
        </div>
      </header>

      <InstallBanner />
      <AlertBanner alerts={activeAlerts} onDismiss={dismissAlert} />

      {error && <div className="error-bar">{error}</div>}

      <main
          ref={mainRef}
          className="main-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {pullDistance > 0 && (
            <div className="pull-indicator" style={{ height: pullDistance }}>
              {loading
                ? <RefreshCw size={20} className="spin" />
                : <ArrowDown size={20} className={pullDistance >= PULL_THRESHOLD ? 'pull-ready' : ''} />}
            </div>
          )}
        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <p className="empty-title">Your watchlist is empty</p>
            <p className="empty-sub">Tap the + button to add stocks or crypto</p>
            <button className="empty-add-btn" onClick={() => setShowSearch(true)}>
              <Plus size={16} /> Add your first asset
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
        <span className="bottom-bar-count">Watching {items.length} {items.length === 1 ? 'asset' : 'assets'}</span>
        <button className="icon-btn icon-btn--danger" onClick={() => { if (window.confirm('Remove all assets from your watchlist?')) clearAll(); }} aria-label="Clear All">
          <CopyX size={20} />
        </button>
      </footer>
    </div>
  );
}
