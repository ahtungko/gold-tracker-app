const GOLD_API_BASE = "https://data-asg.goldprice.org/dbXRates";

export interface GoldPriceQuote {
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

export interface HistoricalGoldPricePoint {
  date: string;
  price: number;
}

/**
 * Fetch gold price from the goldprice.org API.
 */
export async function fetchGoldPrice(currency: string = "USD"): Promise<GoldPriceQuote> {
  const upperCurrency = currency.toUpperCase();
  const url = `${GOLD_API_BASE}/${upperCurrency}`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en-GB;q=0.9,en;q=0.8,zh;q=0.7",
        dnt: "1",
        origin: "https://goldprice.org",
        priority: "u=1, i",
        referer: "https://goldprice.org/",
        "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return parseGoldPriceResponse(data, upperCurrency);
  } catch (error) {
    console.error("Failed to fetch gold price:", error);
    throw error;
  }
}

/**
 * Parse the goldprice.org API response
 * The API returns: { ts, tsj, date, items: [{ curr, xauPrice, xagPrice, chgXau, chgXag, pcXau, pcXag, xauClose, xagClose }] }
 */
export function parseGoldPriceResponse(data: unknown, currency: string): GoldPriceQuote {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid API response");
  }

  const payload = data as Record<string, unknown>;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const item = (items[0] ?? {}) as Record<string, unknown>;

  if (!items.length) {
    throw new Error("Invalid API response structure");
  }

  const toNumber = (value: unknown): number => {
    const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const timestamp =
    typeof payload.ts === "number"
      ? Math.floor(payload.ts / 1000)
      : Math.floor(Date.now() / 1000);

  return {
    timestamp,
    metal: "XAU",
    currency:
      typeof item.curr === "string" && item.curr
        ? item.curr.toUpperCase()
        : currency.toUpperCase(),
    xauPrice: toNumber(item.xauPrice),
    xagPrice: toNumber(item.xagPrice),
    chgXau: toNumber(item.chgXau),
    chgXag: toNumber(item.chgXag),
    pcXau: toNumber(item.pcXau),
    pcXag: toNumber(item.pcXag),
    xauClose: toNumber(item.xauClose),
    xagClose: toNumber(item.xagClose),
  };
}

/**
 * Fetch historical gold price data.
 * Note: the goldprice.org API does not provide historical data. This returns an empty array
 * to indicate no data is available from the upstream service.
 */
export async function fetchHistoricalData(
  currency: string = "USD",
  days: number = 30,
): Promise<HistoricalGoldPricePoint[]> {
  console.warn(`Historical data for ${days} days is not available from goldprice.org API`);
  return [];
}

export { GOLD_API_BASE };
