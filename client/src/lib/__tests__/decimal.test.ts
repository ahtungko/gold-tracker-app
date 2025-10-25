import { describe, expect, it } from 'vitest';
import {
  formatDecimal,
  parseDecimalInput,
  validateDecimalInput,
  decimalAdd,
  decimalSubtract,
  decimalMultiply,
  decimalDivide,
  decimalSum,
  decimalAverage,
  truncateDecimal,
  Decimal,
} from '../decimal';

describe('formatDecimal', () => {
  it('should format decimal values with up to 8 decimal places', () => {
    expect(formatDecimal(1.23456789)).toBe('1.23456789');
    expect(formatDecimal(1.2345678901)).toBe('1.23456789'); // Truncated to 8
  });

  it('should trim trailing zeros by default', () => {
    expect(formatDecimal(1.23000000)).toBe('1.23');
    expect(formatDecimal(1.00000000)).toBe('1');
    expect(formatDecimal(1.10000000)).toBe('1.1');
  });

  it('should keep trailing zeros when trimTrailingZeros is false', () => {
    expect(formatDecimal(1.23, { trimTrailingZeros: false })).toBe('1.23000000');
  });

  it('should truncate without rounding by default', () => {
    expect(formatDecimal(1.999999999, { maxFractionDigits: 8 })).toBe('1.99999999');
    expect(formatDecimal(1.123456789, { maxFractionDigits: 8 })).toBe('1.12345678');
  });

  it('should round when mode is set to round', () => {
    expect(formatDecimal(1.999999999, { maxFractionDigits: 8, mode: 'round' })).toBe('2');
    expect(formatDecimal(1.123456789, { maxFractionDigits: 8, mode: 'round' })).toBe('1.12345679');
  });

  it('should handle different maxFractionDigits', () => {
    expect(formatDecimal(1.23456789, { maxFractionDigits: 2 })).toBe('1.23');
    expect(formatDecimal(1.23456789, { maxFractionDigits: 4 })).toBe('1.2345');
  });

  it('should handle zero', () => {
    expect(formatDecimal(0)).toBe('0');
    expect(formatDecimal(0.00000000)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatDecimal(-1.23456789)).toBe('-1.23456789');
    expect(formatDecimal(-1.23000000)).toBe('-1.23');
  });
});

describe('parseDecimalInput', () => {
  it('should parse valid decimal inputs', () => {
    const result = parseDecimalInput('1.23456789');
    expect(result).toBeInstanceOf(Decimal);
    expect(result?.toString()).toBe('1.23456789');
  });

  it('should return null for inputs with more than 8 decimals', () => {
    expect(parseDecimalInput('1.123456789')).toBeNull();
  });

  it('should return null for empty strings', () => {
    expect(parseDecimalInput('')).toBeNull();
    expect(parseDecimalInput('   ')).toBeNull();
  });

  it('should return null for invalid inputs', () => {
    expect(parseDecimalInput('abc')).toBeNull();
    expect(parseDecimalInput('1.2.3')).toBeNull();
  });

  it('should parse integers', () => {
    const result = parseDecimalInput('123');
    expect(result).toBeInstanceOf(Decimal);
    expect(result?.toString()).toBe('123');
  });
});

describe('validateDecimalInput', () => {
  it('should validate inputs with at most 8 decimal places', () => {
    expect(validateDecimalInput('1.23456789', 8)).toBe(true);
    expect(validateDecimalInput('1.12345678', 8)).toBe(true);
    expect(validateDecimalInput('1.1', 8)).toBe(true);
  });

  it('should reject inputs with more than 8 decimal places', () => {
    expect(validateDecimalInput('1.123456789', 8)).toBe(false);
  });

  it('should validate integers', () => {
    expect(validateDecimalInput('123', 8)).toBe(true);
  });

  it('should accept empty strings as valid', () => {
    expect(validateDecimalInput('', 8)).toBe(true);
    expect(validateDecimalInput('   ', 8)).toBe(true);
  });

  it('should reject invalid inputs', () => {
    expect(validateDecimalInput('abc', 8)).toBe(false);
    expect(validateDecimalInput('1.2.3', 8)).toBe(false);
  });

  it('should respect custom maxDecimals parameter', () => {
    expect(validateDecimalInput('1.123', 2)).toBe(false);
    expect(validateDecimalInput('1.12', 2)).toBe(true);
    expect(validateDecimalInput('1.1', 2)).toBe(true);
  });
});

describe('decimal arithmetic', () => {
  it('should add decimals precisely', () => {
    const result = decimalAdd(0.1, 0.2);
    expect(result.toString()).toBe('0.3');
  });

  it('should subtract decimals precisely', () => {
    const result = decimalSubtract(1.5, 0.3);
    expect(result.toString()).toBe('1.2');
  });

  it('should multiply decimals precisely', () => {
    const result = decimalMultiply(1.23456789, 2);
    expect(result.toString()).toBe('2.46913578');
  });

  it('should divide decimals precisely', () => {
    const result = decimalDivide(10, 3);
    expect(result.toFixed(8)).toBe('3.33333333');
  });

  it('should avoid floating point artifacts', () => {
    const result1 = decimalAdd(0.1, 0.2);
    expect(result1.toNumber()).toBe(0.3); // Not 0.30000000000000004
    
    const result2 = decimalMultiply(0.2, 0.3);
    expect(result2.toNumber()).toBe(0.06); // Not 0.06000000000000001
  });
});

describe('decimalSum', () => {
  it('should sum an array of numbers precisely', () => {
    const result = decimalSum([0.1, 0.2, 0.3]);
    expect(result.toString()).toBe('0.6');
  });

  it('should handle empty arrays', () => {
    const result = decimalSum([]);
    expect(result.toString()).toBe('0');
  });

  it('should handle mixed number and string inputs', () => {
    const result = decimalSum([0.1, '0.2', 0.3]);
    expect(result.toString()).toBe('0.6');
  });
});

describe('decimalAverage', () => {
  it('should calculate average precisely', () => {
    const result = decimalAverage([0.1, 0.2, 0.3]);
    expect(result.toString()).toBe('0.2');
  });

  it('should handle empty arrays', () => {
    const result = decimalAverage([]);
    expect(result.toString()).toBe('0');
  });

  it('should handle single value', () => {
    const result = decimalAverage([5]);
    expect(result.toString()).toBe('5');
  });
});

describe('truncateDecimal', () => {
  it('should truncate to specified decimal places without rounding', () => {
    expect(truncateDecimal(1.999999, 2)).toBe('1.99');
    expect(truncateDecimal(1.123456, 4)).toBe('1.1234');
  });

  it('should handle negative numbers', () => {
    expect(truncateDecimal(-1.999999, 2)).toBe('-1.99');
  });

  it('should pad with zeros to reach specified decimal places', () => {
    expect(truncateDecimal(1.5, 4)).toBe('1.5000');
  });
});

describe('precision edge cases', () => {
  it('should handle very small numbers', () => {
    const result = formatDecimal('0.00000001');
    expect(result).toBe('0.00000001');
  });

  it('should handle large numbers with decimals', () => {
    const result = formatDecimal('123456.12345678');
    expect(result).toBe('123456.12345678');
  });

  it('should handle scientific notation inputs', () => {
    const result = formatDecimal('1e-8');
    expect(result).toBe('0.00000001');
  });

  it('should maintain precision in complex calculations', () => {
    // Test case: purchase price calculation
    const price = new Decimal('1.23456789');
    const weight = new Decimal('2.5');
    const total = price.mul(weight);
    expect(total.toFixed(8)).toBe('3.08641972');
  });

  it('should handle division by troy ounce conversion', () => {
    const troyOuncePrice = 2000;
    const gramPrice = decimalDivide(troyOuncePrice, 31.1034768);
    const formatted = formatDecimal(gramPrice, { maxFractionDigits: 8, trimTrailingZeros: true });
    expect(formatted).toBe('64.30149313');
  });
});
