import { getResolvedLocale } from "./i18n-utils";

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

const DEFAULT_DECIMALS = 2;

function normalizeNumber(value: number): number {
  if (typeof value !== "number") {
    return 0;
  }

  if (Number.isFinite(value)) {
    return value;
  }

  return 0;
}

/**
 * Format raw numbers with locale-aware grouping
 */
export function formatNumber(value: number, decimals: number = DEFAULT_DECIMALS): string {
  return new Intl.NumberFormat(getResolvedLocale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(normalizeNumber(value));
}

/**
 * Format price for display
 */
export function formatPrice(
  price: number,
  currency?: string,
  decimals: number = DEFAULT_DECIMALS,
): string {
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  if (currency) {
    options.style = "currency";
    options.currency = currency;
  }

  return new Intl.NumberFormat(getResolvedLocale(), options).format(normalizeNumber(price));
}

/**
 * Format percentage change
 */
export function formatPercentage(percentage: number, decimals: number = DEFAULT_DECIMALS): string {
  const formatted = new Intl.NumberFormat(getResolvedLocale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(normalizeNumber(percentage));

  return `${formatted}%`;
}
