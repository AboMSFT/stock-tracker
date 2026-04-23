import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWatchlist, useStockPrices, formatPrice, createSupabaseStorageAdapter } from '@inwealthment/shared';
import type { AlertEvent } from '@inwealthment/shared';
import { useAuthContext } from '../../src/AuthContext';
import { supabase } from '../../src/supabase';
import { stockService } from '../../src/services/stockServiceInstance';
import { StockTile } from '../../src/components/StockTile';
import { DraggableGrid } from '../../src/components/DraggableGrid';
import { SearchModal } from '../../src/components/SearchModal';
import { AlertBanner } from '../../src/components/AlertBanner';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { playAlertSound } from '../../src/utils/audio';
import { requestNotificationPermission, sendNotification } from '../../src/utils/notifications';
import { colors } from '../../src/theme';

export default function HomeScreen() {
  const { user, signOut } = useAuthContext();

  // Supabase-backed storage – stable reference per user.
  const storageAdapter = useMemo(
    () => createSupabaseStorageAdapter(supabase, user?.id ?? ''),
    [user?.id]
  );

  const { items, hydrated, addStock, removeStock, setTargetPrice, markAlertFired, reorderAll, clearAll } =
    useWatchlist(storageAdapter, user?.id ?? '');
  const symbols = items.map((i) => i.symbol);
  const { quotes, loading, hasFetched, error, refresh } = useStockPrices(symbols, stockService, 30000);

  const [showSearch, setShowSearch] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<AlertEvent[]>([]);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    requestNotificationPermission().then(setNotifGranted);
  }, []);

  // Check alerts whenever quotes update
  useEffect(() => {
    if (!quotes.size || !hydrated) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes]);

  const dismissAlert = useCallback((id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  function handleClearAll() {
    Alert.alert('Clear Watchlist', 'Remove all assets from your watchlist?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove All', style: 'destructive', onPress: clearAll },
    ]);
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🤑🚀 Inwealthment</Text>
          <View style={styles.headerRight}>
            {!notifGranted && (
              <TouchableOpacity onPress={() => requestNotificationPermission().then(setNotifGranted)}>
                <Text style={styles.headerBtn}>🔔</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerts */}
        <AlertBanner alerts={activeAlerts} onDismiss={dismissAlert} />

        {/* Error bar */}
        {error && (
          <View style={styles.errorBar}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Watchlist */}
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
            <Text style={styles.emptySub}>Tap the + button to add stocks or crypto</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowSearch(true)}>
              <Text style={styles.emptyAddBtnText}>+ Add your first asset</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <DraggableGrid
            data={items}
            keyExtractor={(item) => item.symbol}
            renderItem={(item) => (
              <StockTile
                item={item}
                quote={quotes.get(item.symbol)}
                hasFetched={hasFetched}
                onRemove={removeStock}
                onSetTarget={setTargetPrice}
              />
            )}
            onReorder={(newItems) => reorderAll(newItems.map((i) => i.symbol))}
            contentContainerStyle={styles.grid}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refresh}
                tintColor={colors.accent}
              />
            }
          />
        )}

        {/* Footer */}
        {items.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerCount}>
              Watching {items.length} {items.length === 1 ? 'asset' : 'assets'}
            </Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllBtn}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search modal */}
        <SearchModal
          visible={showSearch}
          onClose={() => setShowSearch(false)}
          onAdd={addStock}
          existingSymbols={symbols}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    fontSize: 20,
  },
  signOutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: colors.accent,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '300',
  },
  errorBar: {
    backgroundColor: '#ff4d6a22',
    padding: 8,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: colors.negative,
    fontSize: 12,
    textAlign: 'center',
  },
  grid: {},
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyAddBtn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerCount: {
    color: colors.muted,
    fontSize: 13,
  },
  clearAllBtn: {
    fontSize: 20,
  },
});
