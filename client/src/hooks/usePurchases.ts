import { useState, useEffect, useCallback } from 'react';
import { Purchase, PurchaseSummary } from '@/lib/types';
import { getPurchases, savePurchase, deletePurchase, getCurrency, saveCurrency, clearCurrency, updatePurchaseInStorage } from '@/lib/storage';

const GRAMS_PER_TROY_OUNCE = 31.1034768;

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string | null>(null);

  const syncCurrencyState = useCallback((storedPurchases: Purchase[]) => {
    if (storedPurchases.length === 0) {
      clearCurrency();
      setCurrency(null);
      return;
    }

    const storedCurrency = getCurrency();
    const fallbackCurrency = storedPurchases[0]?.currency ?? null;

    if (storedCurrency) {
      setCurrency(storedCurrency);
      return;
    }

    if (fallbackCurrency) {
      setCurrency(fallbackCurrency);
      saveCurrency(fallbackCurrency);
    } else {
      setCurrency(null);
    }
  }, []);

  // Load purchases and currency from local storage on mount
  useEffect(() => {
    try {
      const storedPurchases = getPurchases();
      setPurchases(storedPurchases);
      syncCurrencyState(storedPurchases);
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    } finally {
      setLoading(false);
    }
  }, [syncCurrencyState]);

  // Add a new purchase
  const addPurchase = (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
    try {
      const newPurchase: Purchase = {
        ...purchase,
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      savePurchase(newPurchase);
      setPurchases((prev) => [...prev, newPurchase]);

      // Save currency if it's the first purchase
      if (!currency) {
        saveCurrency(newPurchase.currency);
        setCurrency(newPurchase.currency);
      }

      return newPurchase;
    } catch (error) {
      console.error('Failed to add purchase:', error);
      throw error;
    }
  };

  // Delete a purchase
  const removePurchase = (id: string) => {
    try {
      deletePurchase(id);
      setPurchases((prev) => {
        const newPurchases = prev.filter((p) => p.id !== id);
        if (newPurchases.length === 0) {
          clearCurrency();
          setCurrency(null);
        }
        return newPurchases;
      });
    } catch (error) {
      console.error('Failed to delete purchase:', error);
      throw error;
    }
  };

  const refreshPurchases = useCallback(() => {
    try {
      const storedPurchases = getPurchases();
      setPurchases(storedPurchases);
      syncCurrencyState(storedPurchases);
    } catch (error) {
      console.error('Failed to refresh purchases:', error);
    }
  }, [syncCurrencyState]);

  // Calculate summary statistics
  const calculateSummary = (currentGoldPrice: number, currentSilverPrice: number): PurchaseSummary => {
    const totalWeight = purchases.reduce((sum, p) => sum + p.weight, 0);
    const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);

    let estimatedValue = 0;
    purchases.forEach((p) => {
      const currentPrice = p.itemType === 'gold' ? currentGoldPrice : currentSilverPrice;
      const pricePerGram = currentPrice / GRAMS_PER_TROY_OUNCE;

      if (Number.isFinite(pricePerGram)) {
        estimatedValue += pricePerGram * p.weight;
      }
    });

    const estimatedProfit = estimatedValue - totalCost;

    return {
      totalWeight,
      totalCost,
      estimatedValue,
      estimatedProfit,
      itemCount: purchases.length,
    };
  };

  // Update an existing purchase
  const updatePurchase = (id: string, updatedPurchase: Omit<Purchase, 'createdAt'>) => {
    try {
      updatePurchaseInStorage(id, updatedPurchase);
      setPurchases((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updatedPurchase } : p))
      );
    } catch (error) {
      console.error('Failed to update purchase:', error);
      throw error;
    }
  };

  return {
    purchases,
    loading,
    currency,
    addPurchase,
    removePurchase,
    updatePurchase,
    refreshPurchases,
    calculateSummary,
  };
}

