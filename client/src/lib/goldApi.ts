// Gold Price API utility functions
// Using GoldAPI.io for real-time and historical gold prices

const GOLD_API_BASE = 'https://www.goldapi.io/api';
const GOLD_API_KEY = import.meta.env.VITE_GOLD_API_KEY || 'demo'; // Use demo key for testing

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
 * @param currency - Currency code (e.g., 'USD', 'EUR', 'MYR')
 * @returns Gold price data
 */
export async function getCurrentGoldPrice(currency: string = 'USD'): Promise<GoldPrice> {
  try {
    const response = await fetch(
      `${GOLD_API_BASE}/XAU/${currency}`,
      {
        headers: {
          'x-access-token': GOLD_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch gold price:', error);
    // Return mock data for demo purposes
    return getMockGoldPrice(currency);
  }
}

/**
 * Generate mock historical data for demonstration
 * This simulates the price trend over the last 30 days
 */
export function generateMockHistoricalData(days: number = 30): HistoricalData[] {
  const data: HistoricalData[] = [];
  const basePrice = 1950;
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
 * Mock gold price data for testing without API key
 */
function getMockGoldPrice(currency: string): GoldPrice {
  const basePrice = 1950;
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

