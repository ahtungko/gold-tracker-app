import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Purchase, ItemType, Purity } from '@/lib/types';
import { CURRENCIES } from '@/lib/currencies';

interface PurchaseFormProps {
  onSubmit: (purchase: Omit<Purchase, 'id' | 'createdAt'>) => void;
  isLoading?: boolean;
}

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
];

const PURITIES: { value: Purity; label: string }[] = [
  { value: '999', label: '999 (Pure)' },
  { value: '995', label: '995' },
  { value: '990', label: '990' },
  { value: '916', label: '916 (22K)' },
  { value: '750', label: '750 (18K)' },
  { value: '585', label: '585 (14K)' },
  { value: '375', label: '375 (9K)' },
  { value: 'other', label: 'Other' },
];

export default function PurchaseForm({ onSubmit, isLoading = false }: PurchaseFormProps) {
  const [formData, setFormData] = useState({
    itemType: 'gold' as ItemType,
    itemName: '',
    currency: 'MYR',
    pricePerGram: '',
    weight: '',
    purity: '999' as Purity,
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }

    const price = parseFloat(formData.pricePerGram);
    if (!formData.pricePerGram || isNaN(price) || price <= 0) {
      newErrors.pricePerGram = 'Price per gram must be a positive number';
    }

    const weight = parseFloat(formData.weight);
    if (!formData.weight || isNaN(weight) || weight <= 0) {
      newErrors.weight = 'Weight must be a positive number';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const purchase: Omit<Purchase, 'id' | 'createdAt'> = {
      itemType: formData.itemType,
      itemName: formData.itemName.trim(),
      currency: formData.currency,
      pricePerGram: parseFloat(formData.pricePerGram),
      weight: parseFloat(formData.weight),
      purity: formData.purity,
      purchaseDate: formData.purchaseDate,
      totalCost: parseFloat(formData.pricePerGram) * parseFloat(formData.weight),
    };

    onSubmit(purchase);

    // Reset form
    setFormData({
      itemType: 'gold',
      itemName: '',
      currency: 'MYR',
      pricePerGram: '',
      weight: '',
      purity: '999',
      purchaseDate: new Date().toISOString().split('T')[0],
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-muted/50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold">Add Purchase</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Item Type *</label>
          <select
            value={formData.itemType}
            onChange={(e) => setFormData({ ...formData, itemType: e.target.value as ItemType })}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {ITEM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Item Name *</label>
          <input
            type="text"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            placeholder="e.g., Gold Bar, Silver Coin"
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.itemName ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.itemName && <p className="text-red-500 text-xs mt-1">{errors.itemName}</p>}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium mb-1">Currency *</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} - {curr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Per Gram */}
        <div>
          <label className="block text-sm font-medium mb-1">Price Per Gram *</label>
          <input
            type="number"
            step="0.01"
            value={formData.pricePerGram}
            onChange={(e) => setFormData({ ...formData, pricePerGram: e.target.value })}
            placeholder="0.00"
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.pricePerGram ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.pricePerGram && <p className="text-red-500 text-xs mt-1">{errors.pricePerGram}</p>}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium mb-1">Weight (grams) *</label>
          <input
            type="number"
            step="0.01"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="0.00"
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.weight ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
        </div>

        {/* Purity */}
        <div>
          <label className="block text-sm font-medium mb-1">Purity *</label>
          <select
            value={formData.purity}
            onChange={(e) => setFormData({ ...formData, purity: e.target.value as Purity })}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {PURITIES.map((purity) => (
              <option key={purity.value} value={purity.value}>
                {purity.label}
              </option>
            ))}
          </select>
        </div>

        {/* Purchase Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Purchase Date *</label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.purchaseDate ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
        </div>
      </div>

      {/* Total Cost Display */}
      {formData.pricePerGram && formData.weight && (
        <div className="bg-primary/10 p-3 rounded-md">
          <p className="text-sm">
            Total Cost: <span className="font-semibold">{(parseFloat(formData.pricePerGram) * parseFloat(formData.weight)).toFixed(2)} {formData.currency}</span>
          </p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Adding...' : 'Add Purchase'}
      </Button>
    </form>
  );
}

