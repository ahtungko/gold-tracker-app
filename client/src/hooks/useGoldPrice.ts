import { useState, useEffect } from 'react';
import {
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
  hasHistoricalData: boolean;
}

export function useGoldPrice(): UseGoldPriceReturn {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('MYR'); // Default to MYR
  const [timeRange, setTimeRange] = useState<TimeRange>('realtime');

  // Use tRPC to fetch gold price from backend
  const { data: currentPrice, isLoading: loading, refetch: refetchPrice } = trpc.gold.getCurrentPrice.useQuery(
    { currency },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Fetch historical data
  const { data: historicalDataResponse } = trpc.gold.getHistoricalData.useQuery(
    { 
      currency,
      days: timeRange === '1month' ? 30 : timeRange === '3months' ? 90 : 30
    },
    { enabled: false } // Don't auto-fetch since API doesn't provide this
  );

  const refetch = () => {
    refetchPrice();
  };

  useEffect(() => {
    // Update historical data when time range changes
    // Since goldprice.org API doesn't provide historical data, this will be empty
    setHistoricalData(historicalDataResponse || []);
  }, [timeRange, historicalDataResponse]);

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
    hasHistoricalData: historicalData.length > 0,
  };
}

