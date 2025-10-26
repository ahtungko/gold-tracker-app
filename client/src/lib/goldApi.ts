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
 * Format price for display with currency using ceiling rounding to 2 decimals
 */
export function formatPriceCeil2(
  price: number | Decimal,
  currency?: string,
): string {
  const locale = getResolvedLocale();

  try {
    let decimalValue: Decimal;

    if (price instanceof Decimal) {
      decimalValue = new Decimal(price);
    } else if (typeof price === "number") {
      decimalValue = new Decimal(normalizeNumber(price));
    } else {
      decimalValue = new Decimal(0);
    }

    if (!Number.isFinite(decimalValue.toNumber())) {
      decimalValue = new Decimal(0);
    }

    const rounded = decimalValue.toDecimalPlaces(2, Decimal.ROUND_CEIL);
    const formatted = rounded.toFixed(2);

    const parts = formatted.split(".");
    const integerRaw = parts[0] ?? "0";
    const integerNumber = parseFloat(integerRaw);
    const integerPart = Number.isNaN(integerNumber)
      ? integerRaw
      : integerNumber.toLocaleString(locale);
    const decimalPart = `.${parts[1] ?? "00"}`;

    if (currency) {
      const currencyFormatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const roundedNumber = Number(rounded.toFixed(2));

      if (Number.isNaN(roundedNumber)) {
        return currencyFormatter.format(0);
      }

      return currencyFormatter.format(roundedNumber);
    }

    return `${integerPart}${decimalPart}`;
  } catch (error) {
    console.error("Error formatting price with ceiling:", error, price);

    if (currency) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(0);
    }

    return "0.00";
  }
}

/**
 * Format percentage change with fixed decimal places.
 */
export function formatPercentage(
  percentage: number | Decimal,
  decimals: number = 2,
): string {
  const decimalPlaces =
    typeof decimals === "number" && Number.isFinite(decimals) && decimals >= 0
      ? Math.floor(decimals)
      : 2;

  try {
    let decimalValue: Decimal;

    if (percentage instanceof Decimal) {
      decimalValue = new Decimal(percentage);
    } else if (typeof percentage === "number") {
      decimalValue = new Decimal(normalizeNumber(percentage));
    } else {
      decimalValue = new Decimal(0);
    }

    if (!Number.isFinite(decimalValue.toNumber())) {
      decimalValue = new Decimal(0);
    }

    const rounded = decimalValue.toDecimalPlaces(
      decimalPlaces,
      Decimal.ROUND_HALF_UP,
    );
    const formatted = rounded.toFixed(decimalPlaces);

    return `${formatted}%`;
  } catch (error) {
    console.error("Error formatting percentage:", error, percentage);
    return `${(0).toFixed(decimalPlaces)}%`;
  }
}
