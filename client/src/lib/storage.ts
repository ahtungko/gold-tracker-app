import { Purchase, Purity } from './types';

const STORAGE_KEY = 'gold_tracker_purchases';

/**
 * Get all purchases from local storage
 */
export function getPurchases(): Purchase[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading purchases from storage:', error);
    return [];
  }
}

/**
 * Save a new purchase to local storage
 */
export function savePurchase(purchase: Purchase): void {
  try {
    const purchases = getPurchases();
    purchases.push(purchase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  } catch (error) {
    console.error('Error saving purchase to storage:', error);
    throw new Error('Failed to save purchase');
  }
}

/**
 * Update an existing purchase
 */
export function updatePurchaseInStorage(id: string, updated: Partial<Purchase>): void {
  try {
    const purchases = getPurchases();
    const index = purchases.findIndex((p) => p.id === id);
    if (index !== -1) {
      purchases[index] = { ...purchases[index], ...updated };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    }
  } catch (error) {
    console.error('Error updating purchase:', error);
    throw new Error('Failed to update purchase');
  }
}

/**
 * Delete a purchase from local storage
 */
export function deletePurchase(id: string): void {
  try {
    const purchases = getPurchases();
    const filtered = purchases.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting purchase:', error);
    throw new Error('Failed to delete purchase');
  }
}

/**
 * Clear all purchases from local storage
 */
export function clearAllPurchases(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing purchases:', error);
    throw new Error('Failed to clear purchases');
  }
}

/**
 * Save all purchases to local storage
 */
export function saveAllPurchases(purchases: Purchase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  } catch (error) {
    console.error('Error saving all purchases to storage:', error);
    throw new Error('Failed to save all purchases');
  }
}

/**
 * Import purchases from a CSV file
 */
export function importFromCSV(file: File): Promise<Purchase[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;

        if (!csv) {
          throw new Error('CSV file is empty');
        }

        const rows = csv.split('\n').slice(1);
        const purchases: Purchase[] = [];

        rows.forEach((rawRow, index) => {
          const row = rawRow.trim();
          if (!row) {
            return;
          }

          const cells = row.split(',').map((cell) => cell.replace(/"/g, '').trim());

          if (cells.length < 9) {
            throw new Error('Invalid CSV format');
          }

          const [itemType, itemName, currency, pricePerGram, weight, purity, totalCost, purchaseDate, createdAt] = cells;
          const parsedPricePerGram = parseFloat(pricePerGram);
          const parsedWeight = parseFloat(weight);
          const parsedTotalCost = parseFloat(totalCost);

          if (
            !itemName ||
            !currency ||
            !purchaseDate ||
            Number.isNaN(parsedPricePerGram) ||
            Number.isNaN(parsedWeight) ||
            Number.isNaN(parsedTotalCost)
          ) {
            throw new Error('Invalid CSV data');
          }

          const normalizedItemType: 'gold' | 'silver' = itemType === 'silver' ? 'silver' : 'gold';
          const normalizedPurity = (purity as Purity) || '999';

          purchases.push({
            id: `purchase_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            itemType: normalizedItemType,
            itemName,
            currency,
            pricePerGram: parsedPricePerGram,
            weight: parsedWeight,
            purity: normalizedPurity,
            totalCost: parsedTotalCost,
            purchaseDate,
            createdAt: createdAt || new Date().toISOString(),
          });
        });

        saveAllPurchases(purchases);

        if (purchases.length > 0) {
          saveCurrency(purchases[0].currency);
        } else {
          clearCurrency();
        }

        resolve(purchases);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        reject(new Error('Failed to parse CSV file'));
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Export purchases to CSV format
 */
export function exportToCSV(purchases: Purchase[], filename: string): void {
  try {
    const headers = [
      'Item Type',
      'Item Name',
      'Currency',
      'Price Per Gram',
      'Weight (g)',
      'Purity',
      'Total Cost',
      'Purchase Date',
      'Created At',
    ];

    const rows = purchases.map((p) => [
      p.itemType,
      p.itemName,
      p.currency,
      p.pricePerGram.toFixed(2),
      p.weight.toFixed(2),
      p.purity,
      p.totalCost.toFixed(2),
      p.purchaseDate,
      p.createdAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export to CSV');
  }
}

/**
 * Generate filename with current date and time
 */
export function generateExportFilename(itemType: 'gold' | 'silver' | 'all' = 'all'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${itemType}_export_${year}-${month}-${day}-${hours}-${minutes}.csv`;
}

import { CURRENCY_STORAGE_KEY } from '@shared/const';

/**
 * Get the saved currency from local storage
 */
export function getCurrency(): string | null {
  try {
    return localStorage.getItem(CURRENCY_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading currency from storage:', error);
    return null;
  }
}

/**
 * Save the selected currency to local storage
 */
export function saveCurrency(currency: string): void {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch (error) {
    console.error('Error saving currency to storage:', error);
  }
}

/**
 * Clear the saved currency from local storage
 */
export function clearCurrency(): void {
  try {
    localStorage.removeItem(CURRENCY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing currency from storage:', error);
  }
}

