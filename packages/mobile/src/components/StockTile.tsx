import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { WatchlistItem, StockQuote } from '@inwealthment/shared';
import { formatPrice, formatChange } from '@inwealthment/shared';
import { Sparkline } from './Sparkline';
import { colors } from '../theme';

interface StockTileProps {
  item: WatchlistItem;
  quote?: StockQuote;
  hasFetched: boolean;
  onRemove: (symbol: string) => void;
  onSetTarget: (symbol: string, target: number | undefined, currentPrice?: number) => void;
}

export function StockTile({ item, quote, hasFetched, onRemove, onSetTarget }: StockTileProps) {
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [targetInput, setTargetInput] = useState(
    item.targetPrice !== undefined ? String(item.targetPrice) : ''
  );

  const price = quote?.price;
  const changePercent = quote?.changePercent ?? 0;
  const change = quote?.change ?? 0;
  const isPositive = changePercent >= 0;
  const isLoading = !quote && !hasFetched;
  const isMissing = !quote && hasFetched;

  function handleSetTarget() {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) {
      onSetTarget(item.symbol, val, price);
      setShowTargetInput(false);
    }
  }

  function handleClearTarget() {
    onSetTarget(item.symbol, undefined);
    setTargetInput('');
    setShowTargetInput(false);
  }

  const changeColor = isPositive ? colors.positive : colors.negative;

  return (
    <View style={[styles.tile, item.alertFired && styles.tileAlertFired]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.symbolRow}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          {item.assetType === 'crypto' && (
            <View style={styles.cryptoBadge}>
              <Text style={styles.cryptoBadgeText}>CRYPTO</Text>
            </View>
          )}
          {item.targetPrice !== undefined && (
            <View style={[styles.targetBadge, item.alertFired && styles.targetBadgeFired]}>
              <Text style={styles.targetBadgeText}>
                🎯 {formatPrice(item.targetPrice, quote?.currency)}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => onRemove(item.symbol)} hitSlop={8}>
          <Text style={styles.removeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.name} numberOfLines={1}>{item.companyName}</Text>

      {/* Price section */}
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
      ) : isMissing ? (
        <Text style={styles.missing}>No data</Text>
      ) : (
        <View style={styles.priceSection}>
          <Text style={styles.price}>{formatPrice(price!, quote?.currency)}</Text>
          <View style={styles.changeRow}>
            <Text style={[styles.changeText, { color: changeColor }]}>
              {isPositive ? '▲' : '▼'}{' '}
              {isPositive ? '+' : '-'}{formatChange(Math.abs(change), price!)} (
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
      )}

      {/* Sparkline */}
      {quote?.sparkline && (
        <View style={styles.sparklineWrap}>
          <Sparkline prices={quote.sparkline} positive={isPositive} />
        </View>
      )}

      {/* Target price footer */}
      <View style={styles.footer}>
        {showTargetInput ? (
          <View style={styles.targetInputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.targetInput}
              keyboardType="decimal-pad"
              placeholder="Target price"
              placeholderTextColor={colors.muted}
              value={targetInput}
              onChangeText={setTargetInput}
              onSubmitEditing={handleSetTarget}
            />
            <TouchableOpacity style={styles.setBtn} onPress={handleSetTarget}>
              <Text style={styles.setBtnText}>Set</Text>
            </TouchableOpacity>
            {item.targetPrice !== undefined && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearTarget}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowTargetInput(true)}>
            <Text style={styles.targetToggle}>
              🎯 {item.targetPrice !== undefined ? 'Edit target' : 'Set target'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  tileAlertFired: {
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  symbol: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cryptoBadge: {
    backgroundColor: '#f59e0b22',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cryptoBadgeText: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '700',
  },
  targetBadge: {
    backgroundColor: '#3b82f622',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  targetBadgeFired: {
    backgroundColor: '#f59e0b22',
  },
  targetBadgeText: {
    color: '#93c5fd',
    fontSize: 9,
  },
  removeBtn: {
    color: '#666',
    fontSize: 16,
    padding: 4,
  },
  name: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
  },
  loader: {
    marginVertical: 8,
  },
  missing: {
    color: '#666',
    fontSize: 12,
    marginVertical: 8,
  },
  priceSection: {
    marginBottom: 4,
  },
  price: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sparklineWrap: {
    marginVertical: 6,
  },
  footer: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#2a2a34',
    paddingTop: 6,
  },
  targetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dollarSign: {
    color: '#888',
    fontSize: 14,
  },
  targetInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingVertical: 2,
  },
  setBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  setBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: '#888',
    fontSize: 14,
  },
  targetToggle: {
    color: '#888',
    fontSize: 12,
  },
});
