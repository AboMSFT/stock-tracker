import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { AlertEvent } from '@inwealthment/shared';
import { formatPrice } from '@inwealthment/shared';

interface AlertBannerProps {
  alerts: AlertEvent[];
  onDismiss: (id: string) => void;
}

export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (!alerts.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {alerts.map((alert) => (
        <View key={alert.id} style={styles.banner}>
          <Text style={styles.icon}>🔔</Text>
          <View style={styles.content}>
            <Text style={styles.symbol}>{alert.symbol}</Text>
            <Text style={styles.message}>
              Target {formatPrice(alert.targetPrice)} reached!{' '}
              Now {formatPrice(alert.price)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onDismiss(alert.id)} hitSlop={8}>
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b22',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    margin: 8,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    minWidth: 280,
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  symbol: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 13,
  },
  message: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  dismiss: {
    color: '#888',
    fontSize: 16,
    padding: 4,
  },
});
