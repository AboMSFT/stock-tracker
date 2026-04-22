import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { SearchResult } from '@inwealthment/shared';
import { stockService } from '../services/stockServiceInstance';
import { colors } from '../theme';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (symbol: string, companyName: string, assetType: 'stock' | 'crypto') => void;
  existingSymbols: string[];
}

export function SearchModal({ visible, onClose, onAdd, existingSymbols }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await stockService.searchStocks(query);
        setResults(res);
        if (!res.length) setError('No results found.');
      } catch {
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleClose() {
    setQuery('');
    setResults([]);
    setError(null);
    onClose();
  }

  function handleAdd(result: SearchResult) {
    onAdd(result.symbol, result.longname ?? result.shortname, result.assetType ?? 'stock');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add to Watchlist</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search stock or crypto (e.g. AAPL, BTC-USD)"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            autoCapitalize="characters"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.status} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(r) => r.symbol}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: r }) => {
              const already = existingSymbols.includes(r.symbol);
              return (
                <TouchableOpacity
                  style={[styles.resultItem, already && styles.resultItemAdded]}
                  onPress={() => !already && handleAdd(r)}
                  disabled={already}
                >
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultSymbol}>{r.symbol}</Text>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {r.longname ?? r.shortname}
                    </Text>
                    {r.exchDisp && (
                      <Text style={styles.resultExch}>{r.exchDisp}</Text>
                    )}
                  </View>
                  <Text style={already ? styles.addedLabel : styles.addIcon}>
                    {already ? 'Added' : '+'}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a34',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    color: '#888',
    fontSize: 18,
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a24',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  clearBtn: {
    color: '#666',
    fontSize: 14,
    padding: 4,
  },
  status: {
    marginTop: 40,
  },
  errorText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
  },
  resultItemAdded: {
    opacity: 0.5,
  },
  resultInfo: {
    flex: 1,
    marginRight: 8,
  },
  resultSymbol: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultName: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  resultExch: {
    color: '#555',
    fontSize: 11,
    marginTop: 1,
  },
  addIcon: {
    color: '#3b82f6',
    fontSize: 22,
    fontWeight: '300',
  },
  addedLabel: {
    color: '#555',
    fontSize: 12,
  },
});
