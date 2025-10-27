import { describe, expect, it } from "vitest";
import { formatGoldPriceNotification } from "./pushNotificationService";
import type { GoldPriceQuote } from "./goldPriceService";
import { GRAMS_PER_TROY_OUNCE } from "@shared/const";

describe("formatGoldPriceNotification", () => {
  const baseQuote: GoldPriceQuote = {
    timestamp: 1_700_000_000,
    metal: "XAU",
    currency: "MYR",
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

    const pricePerGram = baseQuote.xauPrice / GRAMS_PER_TROY_OUNCE;
    const changePerGram = baseQuote.chgXau / GRAMS_PER_TROY_OUNCE;
    const formattedChange = `${changePerGram >= 0 ? "+" : "-"}${Math.abs(changePerGram).toFixed(2)}`;

    expect(parsed.title).toContain("MYR");
    expect(parsed.body).toContain(`${pricePerGram.toFixed(2)} MYR/g`);
    expect(parsed.body).toContain(formattedChange);
    expect(parsed.body).toContain("+0.56%");
    expect(parsed.data.currency).toBe("MYR");
    expect(parsed.data.price).toBeCloseTo(pricePerGram);
    expect(parsed.data.change).toBeCloseTo(changePerGram);
    expect(parsed.data.changePercent).toBe(0.56);
    expect(parsed.data.timestamp).toBe(1_700_000_000);
  });

  it("indicates downward movement with arrow and sign", () => {
    const negativeQuote: GoldPriceQuote = {
      ...baseQuote,
      chgXau: -5.43,
      pcXau: -1.23,
    };

    const payload = formatGoldPriceNotification(negativeQuote);
    const parsed = JSON.parse(payload);
    const changePerGram = negativeQuote.chgXau / GRAMS_PER_TROY_OUNCE;

    expect(parsed.body).toContain("▼");
    expect(parsed.body).toContain(changePerGram.toFixed(2));
    expect(parsed.body).toContain("-1.23%");
  });
});
