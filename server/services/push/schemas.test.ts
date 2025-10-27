import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERRED_CURRENCY,
  getPreferredCurrency,
  normalizeMetadata,
  normalizeSubscription,
} from "./schemas";

describe("push subscription schemas", () => {
  it("normalizes subscription keys and expiration", () => {
    const normalized = normalizeSubscription({
      endpoint: " https://example.com/endpoint ",
      expirationTime: undefined,
      keys: {
        p256dh: "  key123  ",
        auth: "",
      },
    });

    expect(normalized).toEqual({
      endpoint: "https://example.com/endpoint",
      expirationTime: null,
      keys: {
        p256dh: "key123",
      },
    });
  });

  it("trims metadata fields and uppercases preferred currency", () => {
    const metadata = normalizeMetadata({
      currency: "usd",
      preferredCurrency: " eur ",
      userAgent: "  agent  ",
      language: "",
    });

    expect(metadata).toEqual({
      currency: "usd",
      preferredCurrency: "EUR",
      userAgent: "agent",
    });
  });

  it("falls back to default currency when metadata missing", () => {
    expect(getPreferredCurrency(undefined)).toBe(DEFAULT_PREFERRED_CURRENCY);
  });

  it("prefers preferredCurrency over currency", () => {
    const metadata = normalizeMetadata({
      currency: "usd",
      preferredCurrency: "gbp",
    });

    expect(getPreferredCurrency(metadata)).toBe("GBP");
  });

  it("uses default when only storing default currency", () => {
    const metadata = normalizeMetadata({ preferredCurrency: DEFAULT_PREFERRED_CURRENCY.toLowerCase() });
    expect(getPreferredCurrency(metadata)).toBe(DEFAULT_PREFERRED_CURRENCY);
  });
});
