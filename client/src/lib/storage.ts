import { Purchase } from './types';

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
export function updatePurchase(id: string, updated: Partial<Purchase>): void {
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

