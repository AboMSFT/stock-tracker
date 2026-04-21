import { useState, useRef } from 'react';
import { X, Target, Trash2, TrendingUp, TrendingDown, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WatchlistItem, StockQuote } from '../types';
import { formatPrice, formatChange } from '../utils/formatPrice';

interface StockTileProps {
  item: WatchlistItem;
  quote?: StockQuote;
  hasFetched: boolean;
  onRemove: (symbol: string) => void;
  onSetTarget: (symbol: string, target: number | undefined, currentPrice?: number) => void;
}

export function StockTile({ item, quote, hasFetched, onRemove, onSetTarget }: StockTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.symbol,
  });

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    boxShadow: isDragging ? '0 8px 30px rgba(0,0,0,0.4)' : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  };
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [targetInput, setTargetInput] = useState(
    item.targetPrice !== undefined ? String(item.targetPrice) : ''
  );
  const inputRef = useRef<HTMLInputElement>(null);

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

  function handleTargetKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSetTarget();
    if (e.key === 'Escape') setShowTargetInput(false);
  }

  function openTargetInput() {
    setShowTargetInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const tileClass = `stock-tile ${isPositive ? 'tile-positive' : 'tile-negative'} ${item.alertFired ? 'tile-alert-fired' : ''}`;

  return (
    <div ref={setNodeRef} style={dragStyle} className={tileClass}>
      <div className="tile-header">
        <button
          className="tile-drag-handle"
          {...listeners}
          {...attributes}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <div className="tile-symbol-wrap">
          <span className="tile-symbol">{item.symbol}</span>
          {item.assetType === 'crypto' && <span className="tile-crypto-badge">CRYPTO</span>}
          {item.targetPrice !== undefined && (
            <span className={`tile-target-badge ${item.alertFired ? 'badge-fired' : ''}`}>
              <Target size={10} />
              {formatPrice(item.targetPrice, quote?.currency)}
            </span>
          )}
        </div>
        <button
          className="tile-remove-btn"
          onClick={() => onRemove(item.symbol)}
          aria-label="Remove stock"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <p className="tile-name">{item.companyName}</p>

      {isLoading ? (
        <div className="tile-loading">
          <span className="loading-dots" />
        </div>
      ) : isMissing ? (
        <div className="tile-missing">No data</div>
      ) : (
        <div className="tile-price-section">
          <span className="tile-price">
            {formatPrice(price!, quote?.currency)}
          </span>
          <div className={`tile-change ${isPositive ? 'change-positive' : 'change-negative'}`}>
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>
              {isPositive ? '+' : '-'}
              {formatChange(Math.abs(change), price!)} ({isPositive ? '+' : ''}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}

      <div className="tile-footer">
        {showTargetInput ? (
          <div className="target-input-wrap">
            <span className="target-input-dollar">$</span>
            <input
              ref={inputRef}
              className="target-input"
              type="number"
              min="0"
              step="any"
              placeholder="Target price"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onKeyDown={handleTargetKeyDown}
            />
            <button className="target-set-btn" onClick={handleSetTarget}>Set</button>
            {item.targetPrice !== undefined && (
              <button className="target-clear-btn" onClick={handleClearTarget}>
                <X size={12} />
              </button>
            )}
          </div>
        ) : (
          <button className="target-toggle-btn" onClick={openTargetInput}>
            <Target size={13} />
            {item.targetPrice !== undefined ? 'Edit target' : 'Set target'}
          </button>
        )}
      </div>
    </div>
  );
}
