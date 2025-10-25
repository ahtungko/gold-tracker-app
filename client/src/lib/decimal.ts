import Decimal from 'decimal.js-light';

/**
 * Decimal utility module for precise numeric operations
 * Handles up to 8 decimal places without rounding
 */

// Configure Decimal.js for our use case
Decimal.set({
  precision: 20, // Internal precision for calculations
  rounding: Decimal.ROUND_DOWN, // Default to truncation
  toExpNeg: -20,
  toExpPos: 20,
});

export interface FormatDecimalOptions {
  maxFractionDigits?: number;
  trimTrailingZeros?: boolean;
  mode?: 'truncate' | 'round';
  locale?: string;
}

/**
 * Format a decimal value for display
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted string
 */
export function formatDecimal(
  value: number | string | Decimal,
  options: FormatDecimalOptions = {}
): string {
  const {
    maxFractionDigits = 8,
    trimTrailingZeros = true,
    mode = 'truncate',
  } = options;

  try {
    let decimal = new Decimal(value);

    // Handle truncation or rounding
    if (mode === 'truncate') {
      // Truncate to maxFractionDigits without rounding
      decimal = decimal.toDecimalPlaces(maxFractionDigits, Decimal.ROUND_DOWN);
    } else {
      // Round to maxFractionDigits
      decimal = decimal.toDecimalPlaces(maxFractionDigits, Decimal.ROUND_HALF_UP);
    }

    // Convert to string with fixed decimals
    let result = decimal.toFixed(maxFractionDigits);

    // Trim trailing zeros if requested
    if (trimTrailingZeros) {
      result = result.replace(/\.?0+$/, '');
      // Ensure at least one decimal place remains for values with decimals
      if (result.indexOf('.') === -1 && decimal.toString().indexOf('.') !== -1) {
        // If original had decimals but they were all zeros, keep the integer part
      } else if (result.indexOf('.') !== -1 && result.endsWith('.')) {
        result = result.slice(0, -1);
      }
    }

    return result;
  } catch (error) {
    console.error('Error formatting decimal:', error, value);
    return '0';
  }
}

/**
 * Parse a numeric input value, ensuring it has at most 8 decimal places
 * @param value - The input value to parse
 * @returns Parsed Decimal or null if invalid
 */
export function parseDecimalInput(value: string): Decimal | null {
  if (!value || value.trim() === '') {
    return null;
  }

  try {
    const decimal = new Decimal(value);
    
    // Check if it has more than 8 decimal places
    const decimalPlaces = decimal.decimalPlaces();
    if (decimalPlaces > 8) {
      return null; // Invalid: too many decimal places
    }

    return decimal;
  } catch (error) {
    return null; // Invalid input
  }
}

/**
 * Validate that a numeric input has at most maxDecimals decimal places
 * @param value - The string value to validate
 * @param maxDecimals - Maximum allowed decimal places (default: 8)
 * @returns true if valid, false otherwise
 */
export function validateDecimalInput(value: string, maxDecimals: number = 8): boolean {
  if (!value || value.trim() === '') {
    return true; // Empty is valid
  }

  try {
    const decimal = new Decimal(value);
    const decimalPlaces = decimal.decimalPlaces();
    return decimalPlaces <= maxDecimals;
  } catch (error) {
    return false;
  }
}

/**
 * Add two decimal numbers with precision
 */
export function decimalAdd(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return new Decimal(a).add(new Decimal(b));
}

/**
 * Subtract two decimal numbers with precision
 */
export function decimalSubtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return new Decimal(a).sub(new Decimal(b));
}

/**
 * Multiply two decimal numbers with precision
 */
export function decimalMultiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return new Decimal(a).mul(new Decimal(b));
}

/**
 * Divide two decimal numbers with precision
 */
export function decimalDivide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return new Decimal(a).div(new Decimal(b));
}

/**
 * Sum an array of decimal numbers with precision
 */
export function decimalSum(values: (number | string | Decimal)[]): Decimal {
  return values.reduce<Decimal>(
    (sum, value) => sum.add(new Decimal(value)),
    new Decimal(0)
  );
}

/**
 * Calculate average of decimal numbers with precision
 */
export function decimalAverage(values: (number | string | Decimal)[]): Decimal {
  if (values.length === 0) {
    return new Decimal(0);
  }
  const sum = decimalSum(values);
  return sum.div(values.length);
}

/**
 * Convert Decimal to number (use with caution - may lose precision)
 */
export function toNumber(decimal: Decimal): number {
  return decimal.toNumber();
}

/**
 * Truncate a value to specified decimal places without rounding
 */
export function truncateDecimal(value: number | string, decimalPlaces: number): string {
  const decimal = new Decimal(value);
  const truncated = decimal.toDecimalPlaces(decimalPlaces, Decimal.ROUND_DOWN);
  return truncated.toFixed(decimalPlaces);
}

export { Decimal };
