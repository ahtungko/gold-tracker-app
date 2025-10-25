import { describe, expect, it, vi } from 'vitest';

vi.mock('../i18n-utils', () => ({
  getResolvedLocale: vi.fn(() => 'en-US'),
}));

import { formatPriceCeil2 } from '../goldApi';
import { Decimal } from '../decimal';

describe('formatPriceCeil2', () => {
  it('ceils positive prices to two decimal places', () => {
    expect(formatPriceCeil2(1.2301)).toBe('1.24');
    expect(formatPriceCeil2(0.1001)).toBe('0.11');
  });

  it('keeps two decimal digits for whole-number inputs', () => {
    expect(formatPriceCeil2(1.2)).toBe('1.20');
    expect(formatPriceCeil2(5)).toBe('5.00');
  });

  it('formats prices with currency symbols and grouping', () => {
    expect(formatPriceCeil2(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatPriceCeil2(0.01, 'USD')).toBe('$0.01');
  });

  it('ceils negative prices toward positive infinity', () => {
    expect(formatPriceCeil2(-1.239)).toBe('-1.23');
    expect(formatPriceCeil2(-0.0001)).toBe('0.00');
  });

  it('supports Decimal inputs', () => {
    expect(formatPriceCeil2(new Decimal('2.001'))).toBe('2.01');
  });
});
