import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentGoldPrice,
  generateMockHistoricalData,
  GoldPrice,
  HistoricalData,
} from '@/lib/goldApi';

export type TimeRange = 'realtime' | '1month' | '3months';

interface UseGoldPriceReturn {
  currentPrice: GoldPrice | null;
  historicalData: HistoricalData[];
  loading: boolean;
  error: string | null;
  currency: string;
  setCurrency: (currency: string) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refetch: () => Promise<void>;
}

export function useGoldPrice(): UseGoldPriceReturn {
  const [currentPrice, setCurrentPrice] = useState<GoldPrice | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [timeRange, setTimeRange] = useState<TimeRange>('realtime');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch current price
      const priceData = await getCurrentGoldPrice(currency);
      setCurrentPrice(priceData);

      // Generate historical data based on time range
      let days = 30;
      if (timeRange === '1month') {
        days = 30;
      } else if (timeRange === '3months') {
        days = 90;
      }

      const historical = generateMockHistoricalData(days);
      setHistoricalData(historical);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gold price data');
    } finally {
      setLoading(false);
    }
  }, [currency, timeRange]);

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 30 seconds for real-time data
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    currentPrice,
    historicalData,
    loading,
    error,
    currency,
    setCurrency,
    timeRange,
    setTimeRange,
    refetch: fetchData,
  };
}

