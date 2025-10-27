import { describe, expect, it } from "vitest";
import { formatGoldPriceNotification } from "./pushNotificationService";
import type { GoldPriceQuote } from "./goldPriceService";

describe("formatGoldPriceNotification", () => {
  const baseQuote: GoldPriceQuote = {
    timestamp: 1_700_000_000,
    metal: "XAU",
    currency: "USD",
    xauPrice: 2345.67,
    xagPrice: 0,
    chgXau: 12.34,
    chgXag: 0,
    pcXau: 0.56,
    pcXag: 0,
    xauClose: 0,
    xagClose: 0,
  };

  it("creates a payload with formatted change and metadata", () => {
    const payload = formatGoldPriceNotification(baseQuote);
    const parsed = JSON.parse(payload);

    expect(parsed.title).toContain("USD");
    expect(parsed.body).toContain("2345.67 USD");
    expect(parsed.body).toContain("+12.34");
    expect(parsed.body).toContain("+0.56%");
    expect(parsed.data).toMatchObject({
      currency: "USD",
      price: 2345.67,
      change: 12.34,
      changePercent: 0.56,
      timestamp: 1_700_000_000,
    });
  });

  it("indicates downward movement with arrow and sign", () => {
    const negativeQuote: GoldPriceQuote = {
      ...baseQuote,
      chgXau: -5.43,
      pcXau: -1.23,
    };

    const payload = formatGoldPriceNotification(negativeQuote);
    const parsed = JSON.parse(payload);

    expect(parsed.body).toContain("▼");
    expect(parsed.body).toContain("-5.43");
    expect(parsed.body).toContain("-1.23%");
  });
});
