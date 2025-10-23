// Gold Price API utility functions
// Using goldprice.org API for real-time gold prices

export interface GoldPrice {
  timestamp: number;
  metal: string;
  currency: string;
  xauPrice: number;
  xagPrice: number;
  chgXau: number;
  chgXag: number;
  pcXau: number;
  pcXag: number;
  xauClose: number;
  xagClose: number;
}

export interface HistoricalData {
  date: string;
  price: number;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return price.toFixed(decimals);
}

/**
 * Format percentage change
 */
export function formatPercentage(percentage: number, decimals: number = 2): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(decimals)}%`;
}

