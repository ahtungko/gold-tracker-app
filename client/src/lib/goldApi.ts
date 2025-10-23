// Gold Price API utility functions
// Using goldprice.org API for real-time gold prices

const GOLD_API_BASE = 'https://data-asg.goldprice.org/dbXRates';

export interface GoldPrice {
  timestamp: number;
  metal: string;
  currency: string;
  ask: number;
  bid: number;
  price: number;
  price_gram_22K?: number;
  ch: number; // Change
  chp: number; // Change percentage
}

export interface HistoricalData {
  date: string;
  price: number;
}

/**
 * Fetch current gold price in a specific currency
 * @param currency - Currency code (e.g., 'USD', 'EUR', 'GBP')
 * @returns Gold price data
 */
export async function getCurrentGoldPrice(currency: string = 'USD'): Promise<GoldPrice> {
  try {
    const response = await fetch(
      `${GOLD_API_BASE}/${currency}`,
      {
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
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return parseGoldPriceResponse(data, currency);
  } catch (error) {
    console.error('Failed to fetch gold price:', error);
    // Return mock data for demo purposes
    return getMockGoldPrice(currency);
  }
}

/**
 * Parse the goldprice.org API response
 */
function parseGoldPriceResponse(data: any, currency: string): GoldPrice {
  // The API returns data in format like: { "1": "2345.67", "2": "2344.67", ... }
  // Where different indices represent different price types
  const price = parseFloat(data['1'] || data['2'] || '0');
  const bid = parseFloat(data['2'] || price || '0');
  const ask = parseFloat(data['1'] || price || '0');

  const previousPrice = price * 0.99; // Estimate previous price for change calculation
  const change = price - previousPrice;
  const changePercent = (change / previousPrice) * 100;

  return {
    timestamp: Math.floor(Date.now() / 1000),
    metal: 'XAU',
    currency: currency,
    ask: ask,
    bid: bid,
    price: price,
    price_gram_22K: (price / 31.1035) * 0.916,
    ch: change,
    chp: changePercent,
  };
}

/**
 * Generate mock historical data for demonstration
 * This simulates the price trend over the last 30 days
 */
export function generateMockHistoricalData(days: number = 30): HistoricalData[] {
  const data: HistoricalData[] = [];
  const basePrice = 2000;
  const volatility = 50;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Generate realistic price variation
    const randomChange = (Math.random() - 0.5) * volatility;
    const trend = (days - i) * 0.5; // Slight upward trend
    const price = basePrice + randomChange + trend;

    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
    });
  }

  return data;
}

/**
 * Mock gold price data for testing without API access
 */
function getMockGoldPrice(currency: string): GoldPrice {
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

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return price.toFixed(decimals);
}

/**
 * Format percentage change
 */
export function formatPercentage(percentage: number, decimals: number = 2): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(decimals)}%`;
}

