import { useState, useEffect } from 'react';
import {
  generateMockHistoricalData,
  GoldPrice,
  HistoricalData,
} from '@/lib/goldApi';
import { trpc } from '@/lib/trpc';

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
  refetch: () => void;
}

export function useGoldPrice(): UseGoldPriceReturn {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [timeRange, setTimeRange] = useState<TimeRange>('realtime');

  // Use tRPC to fetch gold price from backend
  const { data: currentPrice, isLoading: loading, refetch: refetchPrice } = trpc.gold.getCurrentPrice.useQuery(
    { currency },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const refetch = () => {
    refetchPrice();
  };

  useEffect(() => {
    // Generate historical data based on time range
    let days = 30;
    if (timeRange === '1month') {
      days = 30;
    } else if (timeRange === '3months') {
      days = 90;
    }

    const historical = generateMockHistoricalData(days);
    setHistoricalData(historical);
  }, [timeRange]);

  return {
    currentPrice: currentPrice || null,
    historicalData,
    loading,
    error,
    currency,
    setCurrency,
    timeRange,
    setTimeRange,
    refetch,
  };
}

