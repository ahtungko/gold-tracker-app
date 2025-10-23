/**
 * Purchase item types
 */
export type ItemType = 'gold' | 'silver';
export type Purity = '999' | '995' | '990' | '916' | '750' | '585' | '375' | 'other';

/**
 * Purchase record interface
 */
export interface Purchase {
  id: string;
  itemType: ItemType;
  itemName: string;
  currency: string;
  pricePerGram: number;
  weight: number; // in grams
  purity: Purity;
  purchaseDate: string; // ISO date string
  totalCost: number; // calculated: pricePerGram * weight
  createdAt: string; // ISO timestamp
}

/**
 * Purchase summary statistics
 */
export interface PurchaseSummary {
  totalWeight: number; // in grams
  totalCost: number; // in selected currency
  estimatedValue: number; // current market value in selected currency
  estimatedProfit: number; // estimated profit/loss in selected currency
  itemCount: number;
}

