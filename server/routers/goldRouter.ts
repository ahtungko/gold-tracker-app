import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

const GOLD_API_BASE = 'https://data-asg.goldprice.org/dbXRates';

interface GoldPriceResponse {
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

interface HistoricalData {
  date: string;
  price: number;
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
    throw error; // Don't return mock data - let the error propagate
  }
}

/**
 * Parse the goldprice.org API response
 * The API returns: { ts, tsj, date, items: [{ curr, xauPrice, xagPrice, chgXau, chgXag, pcXau, pcXag, xauClose, xagClose }] }
 */
function parseGoldPriceResponse(data: any, currency: string): GoldPriceResponse {
  try {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Invalid API response structure');
    }

    const item = data.items[0];
    
    return {
      timestamp: Math.floor(data.ts / 1000),
      metal: 'XAU',
      currency: item.curr || currency,
      xauPrice: parseFloat(item.xauPrice) || 0,
      xagPrice: parseFloat(item.xagPrice) || 0,
      chgXau: parseFloat(item.chgXau) || 0,
      chgXag: parseFloat(item.chgXag) || 0,
      pcXau: parseFloat(item.pcXau) || 0,
      pcXag: parseFloat(item.pcXag) || 0,
      xauClose: parseFloat(item.xauClose) || 0,
      xagClose: parseFloat(item.xagClose) || 0,
    };
  } catch (error) {
    console.error('Error parsing gold price response:', error);
    throw error; // Don't return mock data - let the error propagate
  }
}

/**
 * Fetch historical gold price data
 * Note: The goldprice.org API only provides current data
 * Historical data would require a different API or database
 */
async function fetchHistoricalData(currency: string = 'USD', days: number = 30): Promise<HistoricalData[]> {
  // The goldprice.org API does not provide historical data
  // This endpoint will return empty array to indicate no data available
  console.warn(`Historical data for ${days} days is not available from goldprice.org API`);
  return [];
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

  /**
   * Get historical gold price data
   * Note: Returns empty array as goldprice.org API doesn't provide historical data
   */
  getHistoricalData: publicProcedure
    .input(z.object({ 
      currency: z.string().default('USD'),
      days: z.number().default(30)
    }))
    .query(async ({ input }) => {
      return await fetchHistoricalData(input.currency, input.days);
    }),
});

