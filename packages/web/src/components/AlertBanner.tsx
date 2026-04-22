import { X, Bell } from 'lucide-react';
import type { AlertEvent } from '@inwealthment/shared';
import { formatPrice } from '@inwealthment/shared';

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
              Target {formatPrice(alert.targetPrice)} reached!
              <br />
              Current price: {formatPrice(alert.price)}
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
