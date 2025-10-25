import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Purchase, Purity } from '@/lib/types';
import { CURRENCIES } from '@/lib/currencies';
import { useTranslation } from 'react-i18next';
import { validateDecimalInput, decimalMultiply, formatDecimal } from '@/lib/decimal';

interface PurchaseFormProps {
  onSubmit: (purchase: Omit<Purchase, 'createdAt'>) => void;
  isLoading?: boolean;
  currency?: string | null;
  initialPurchase?: Purchase; // New prop for editing
}

const GOLD_TYPES = [
  { value: 'gold_bar', labelKey: 'goldBar' },
  { value: 'gold_coin', labelKey: 'goldCoin' },
  { value: 'jewelry', labelKey: 'jewelry' },
  { value: 'charm', labelKey: 'charm' },
  { value: 'gold_bean', labelKey: 'goldBean' },
  { value: 'paper_gold', labelKey: 'paperGold' },
  { value: 'other', labelKey: 'other' },
];

const PURITIES: { value: Purity; labelKey: string }[] = [
  { value: '999', labelKey: 'purity999_9' },
  { value: '995', labelKey: 'purity999' },
  { value: '916', labelKey: 'purity916' },
  { value: '750', labelKey: 'purityTNGGold' },
  { value: '585', labelKey: 'purityPublicGold' },
  { value: '375', labelKey: 'purityMaybankGold' },
  { value: 'other', labelKey: 'other' },
];

export default function PurchaseForm({ onSubmit, isLoading = false, currency, initialPurchase }: PurchaseFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    itemType: initialPurchase?.itemType || 'gold_bar',
    itemName: initialPurchase?.itemName || '',
    currency: initialPurchase?.currency || currency || 'MYR',
    pricePerGram: initialPurchase?.pricePerGram.toString() || '',
    weight: initialPurchase?.weight.toString() || '',
    purity: initialPurchase?.purity || ('999' as Purity),
    purchaseDate: initialPurchase?.purchaseDate || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currency && !initialPurchase) {
      setFormData((prev) => ({ ...prev, currency }));
    }
  }, [currency, initialPurchase]);

  // Get today's date for max date validation
  const today = new Date().toISOString().split('T')[0];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = t('itemNameRequired');
    }

    const price = parseFloat(formData.pricePerGram);
    if (!formData.pricePerGram || isNaN(price) || price <= 0) {
      newErrors.pricePerGram = t('pricePerGramPositive');
    } else if (!validateDecimalInput(formData.pricePerGram, 8)) {
      newErrors.pricePerGram = t('pricePerGramMaxDecimals', { max: 8, defaultValue: 'Price per gram can have at most 8 decimal places' });
    }

    const weight = parseFloat(formData.weight);
    if (!formData.weight || isNaN(weight) || weight <= 0) {
      newErrors.weight = t('weightPositive');
    } else if (!validateDecimalInput(formData.weight, 8)) {
      newErrors.weight = t('weightMaxDecimals', { max: 8, defaultValue: 'Weight can have at most 8 decimal places' });
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = t('purchaseDateRequired');
    }

    if (formData.purchaseDate > today) {
      newErrors.purchaseDate = t('purchaseDateNotInFuture');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Use precise decimal multiplication for total cost
    const totalCostDecimal = decimalMultiply(formData.pricePerGram, formData.weight);
    
    const purchase: Omit<Purchase, 'createdAt'> = {
      id: initialPurchase?.id || '', // Include ID if editing, empty string otherwise
      itemType: 'gold',
      itemName: formData.itemName.trim(),
      currency: formData.currency,
      pricePerGram: parseFloat(formData.pricePerGram),
      weight: parseFloat(formData.weight),
      purity: formData.purity,
      purchaseDate: formData.purchaseDate,
      totalCost: totalCostDecimal.toNumber(),
    };

    onSubmit(purchase);

    // Reset form only if adding a new purchase
    if (!initialPurchase) {
      setFormData({
        itemType: 'gold_bar',
        itemName: '',
        currency: currency || 'MYR',
        pricePerGram: '',
        weight: '',
        purity: '999',
        purchaseDate: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-muted/50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold">{initialPurchase ? t('editPurchase') : t('addPurchase')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gold Type */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('goldType')} *</label>
          <select
            value={formData.itemType}
            onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {GOLD_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.labelKey)}
              </option>
            ))}
          </select>
        </div>

        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('itemName')} *</label>
          <input
            type="text"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            placeholder={t('itemNamePlaceholder')}
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.itemName ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.itemName && <p className="text-red-500 text-xs mt-1">{errors.itemName}</p>}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('currency')} *</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            disabled={!!currency}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
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
          <label className="block text-sm font-medium mb-1">{t('pricePerGram')} *</label>
          <input
            type="number"
            step="0.00000001"
            value={formData.pricePerGram}
            onChange={(e) => setFormData({ ...formData, pricePerGram: e.target.value })}
            placeholder="0.00000000"
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.pricePerGram ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.pricePerGram && <p className="text-red-500 text-xs mt-1">{errors.pricePerGram}</p>}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('weightGrams')} *</label>
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
          <label className="block text-sm font-medium mb-1">{t('purity')} *</label>
          <select
            value={formData.purity}
            onChange={(e) => setFormData({ ...formData, purity: e.target.value as Purity })}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {PURITIES.map((purity) => (
              <option key={purity.value} value={purity.value}>
                {t(purity.labelKey)}
              </option>
            ))}
          </select>
        </div>

        {/* Purchase Date */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('purchaseDate')} *</label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            max={today}
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
            {t('totalCost')}: <span className="font-semibold">{formatDecimal(decimalMultiply(formData.pricePerGram, formData.weight), { maxFractionDigits: 8, trimTrailingZeros: true, mode: 'truncate' })} {formData.currency}</span>
          </p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t('adding') : initialPurchase ? t('updatePurchase') : t('addPurchase')}
      </Button>
    </form>
  );
}

