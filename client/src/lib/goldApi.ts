import { getResolvedLocale } from "./i18n-utils";
import { formatDecimal, Decimal } from "./decimal";

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

const DEFAULT_DECIMALS = 8;

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
 * Format raw numbers with precise decimal handling (up to 8 decimals)
 */
export function formatNumber(value: number | Decimal, decimals: number = DEFAULT_DECIMALS): string {
  const formatted = formatDecimal(value, {
    maxFractionDigits: decimals,
    trimTrailingZeros: true,
    mode: 'truncate',
  });
  
  // Apply locale-aware grouping
  const locale = getResolvedLocale();
  const parts = formatted.split('.');
  const integerPart = parseFloat(parts[0]).toLocaleString(locale);
  
  if (parts.length > 1) {
    return `${integerPart}.${parts[1]}`;
  }
  
  return integerPart;
}

/**
 * Format price for display with currency (up to 8 decimals, no rounding)
 */
export function formatPrice(
  price: number | Decimal,
  currency?: string,
  decimals: number = DEFAULT_DECIMALS,
): string {
  const normalizedPrice = normalizeNumber(typeof price === 'number' ? price : price.toNumber());
  
  // Format with precise decimal handling
  const formatted = formatDecimal(normalizedPrice, {
    maxFractionDigits: decimals,
    trimTrailingZeros: true,
    mode: 'truncate',
  });

  const locale = getResolvedLocale();
  
  if (currency) {
    // Get currency symbol from Intl
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    
    const currencySymbol = parts.find(part => part.type === 'currency')?.value || currency;
    
    // Apply locale-aware grouping to the formatted value
    const numParts = formatted.split('.');
    const integerPart = parseFloat(numParts[0]).toLocaleString(locale);
    const decimalPart = numParts.length > 1 ? `.${numParts[1]}` : '';
    
    // Determine currency position based on locale
    const testFormat = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(1);
    
    const currencyFirst = testFormat.indexOf(currencySymbol) < testFormat.indexOf('1');
    
    if (currencyFirst) {
      return `${currencySymbol}${integerPart}${decimalPart}`;
    } else {
      return `${integerPart}${decimalPart} ${currencySymbol}`;
    }
  }

  // Apply locale-aware grouping
  const parts = formatted.split('.');
  const integerPart = parseFloat(parts[0]).toLocaleString(locale);
  
  if (parts.length > 1) {
    return `${integerPart}.${parts[1]}`;
  }
  
  return integerPart;
}

/**
 * Format percentage change with precise decimals
 */
export function formatPercentage(percentage: number | Decimal, decimals: number = DEFAULT_DECIMALS): string {
  const formatted = formatDecimal(percentage, {
    maxFractionDigits: decimals,
    trimTrailingZeros: true,
    mode: 'truncate',
  });

  return `${formatted}%`;
}
