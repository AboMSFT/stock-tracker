function currencyPrefix(currency = 'USD'): string {
  return currency === 'USD' ? '$' : `${currency} `;
}

function decimalsForPrice(price: number): number {
  if (price >= 1) return 2;
  if (price >= 0.0001) return 4;
  return 6;
}

/** Format a price with smart decimal precision and currency prefix. */
export function formatPrice(price: number, currency = 'USD'): string {
  const prefix = currencyPrefix(currency);
  const decimals = decimalsForPrice(price);
  if (price >= 1) {
    return prefix + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return prefix + price.toFixed(decimals);
}

/** Format an absolute change value with smart decimal precision (no currency prefix). */
export function formatChange(change: number, price: number): string {
  const decimals = decimalsForPrice(Math.abs(price));
  return change.toFixed(decimals);
}
