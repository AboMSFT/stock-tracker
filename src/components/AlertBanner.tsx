import { X, Bell } from 'lucide-react';
import type { AlertEvent } from '../types';

interface AlertBannerProps {
  alerts: AlertEvent[];
  onDismiss: (id: string) => void;
}

export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (!alerts.length) return null;

  return (
    <div className="alert-banner-container">
      {alerts.map((alert) => (
        <div key={alert.id} className="alert-banner">
          <Bell size={16} className="alert-icon" />
          <div className="alert-content">
            <span className="alert-symbol">{alert.symbol}</span>
            <span className="alert-message">
              Target ${alert.targetPrice.toFixed(2)} reached!
              <br />
              Current price: ${alert.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            className="alert-dismiss-btn"
            onClick={() => onDismiss(alert.id)}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
