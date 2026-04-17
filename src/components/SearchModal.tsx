import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Loader } from 'lucide-react';
import { searchStocks } from '../services/stockService';
import type { SearchResult } from '../types';

interface SearchModalProps {
  onClose: () => void;
  onAdd: (symbol: string, companyName: string) => void;
  existingSymbols: string[];
}

export function SearchModal({ onClose, onAdd, existingSymbols }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        const res = await searchStocks(query);
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

  function handleAdd(result: SearchResult) {
    onAdd(result.symbol, result.longname ?? result.shortname);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 className="modal-title">Add Stock</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="search-bar-wrap">
          <Search size={16} className="search-icon" />
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search ticker or company (e.g. AAPL, Apple)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="search-results">
          {loading && (
            <div className="search-status">
              <Loader size={18} className="spin" />
              <span>Searching…</span>
            </div>
          )}
          {!loading && error && <p className="search-status search-error">{error}</p>}
          {!loading && results.map((r) => {
            const already = existingSymbols.includes(r.symbol);
            return (
              <button
                key={r.symbol}
                className={`search-result-item ${already ? 'result-added' : ''}`}
                onClick={() => !already && handleAdd(r)}
                disabled={already}
              >
                <div className="result-info">
                  <span className="result-symbol">{r.symbol}</span>
                  <span className="result-name">{r.longname ?? r.shortname}</span>
                  {r.exchDisp && <span className="result-exch">{r.exchDisp}</span>}
                </div>
                {already ? (
                  <span className="result-added-label">Added</span>
                ) : (
                  <Plus size={18} className="result-add-icon" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
