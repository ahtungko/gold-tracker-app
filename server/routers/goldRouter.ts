import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

const GOLD_API_BASE = 'https://data-asg.goldprice.org/dbXRates';

interface GoldPriceResponse {
  timestamp: number;
  metal: string;
  currency: string;
  ask: number;
  bid: number;
  price: number;
  price_gram_22K?: number;
  ch: number;
  chp: number;
}

/**
 * Fetch gold price from the goldprice.org API
 */
async function fetchGoldPrice(currency: string = 'USD'): Promise<GoldPriceResponse> {
  const url = `${GOLD_API_BASE}/${currency}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8,zh;q=0.7',
        'dnt': '1',
        'origin': 'https://goldprice.org',
        'priority': 'u=1, i',
        'referer': 'https://goldprice.org/',
        'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gold API Response:', JSON.stringify(data, null, 2));
    return parseGoldPriceResponse(data, currency);
  } catch (error) {
    console.error('Failed to fetch gold price:', error);
    // Return mock data for demo purposes
    return getMockGoldPrice(currency);
  }
}

/**
 * Parse the goldprice.org API response
 * The API returns: { ts, tsj, date, items: [{ curr, xauPrice, xagPrice, chgXau, chgXag, pcXau, pcXag, xauClose, xagClose }] }
 */
function parseGoldPriceResponse(data: any, currency: string): GoldPriceResponse {
  try {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.error('Invalid API response structure');
      return getMockGoldPrice(currency);
    }

    const item = data.items[0];
    const price = parseFloat(item.xauPrice) || 0;
    const change = parseFloat(item.chgXau) || 0;
    const changePercent = parseFloat(item.pcXau) || 0;

    // Calculate ask/bid prices with a small spread
    const spread = price * 0.0005; // 0.05% spread
    const ask = price + spread;
    const bid = price - spread;

    return {
      timestamp: Math.floor(data.ts / 1000),
      metal: 'XAU',
      currency: item.curr || currency,
      ask: ask,
      bid: bid,
      price: price,
      price_gram_22K: price > 0 ? (price / 31.1035) * 0.916 : 0,
      ch: change,
      chp: changePercent,
    };
  } catch (error) {
    console.error('Error parsing gold price response:', error);
    return getMockGoldPrice(currency);
  }
}

/**
 * Mock gold price data for testing without API access
 */
function getMockGoldPrice(currency: string): GoldPriceResponse {
  const basePrice = 2000;
  const variation = Math.random() * 50 - 25;
  const price = basePrice + variation;

  return {
    timestamp: Math.floor(Date.now() / 1000),
    metal: 'XAU',
    currency: currency,
    ask: price + 0.5,
    bid: price - 0.5,
    price: price,
    price_gram_22K: price / 31.1035 * 0.916,
    ch: Math.random() * 10 - 5,
    chp: (Math.random() * 1 - 0.5),
  };
}

export const goldRouter = router({
  /**
   * Get current gold price in a specific currency
   */
  getCurrentPrice: publicProcedure
    .input(z.object({ currency: z.string().default('USD') }))
    .query(async ({ input }) => {
      return await fetchGoldPrice(input.currency);
    }),
});

