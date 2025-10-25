import { Purchase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatPriceCeil2 } from "@/lib/goldApi";
import { useTranslation } from 'react-i18next';
import { decimalMultiply, decimalDivide, decimalSubtract, formatDecimal } from '@/lib/decimal';

interface PurchaseListProps {
  purchases: Purchase[];
  onDelete: (id: string) => void;
  onEdit: (purchase: Purchase) => void; // New prop for editing
  currency: string | null;
  currentPrices: {
    gold: number;
    silver: number;
  };
}

export default function PurchaseList({
  purchases,
  onDelete,
  onEdit,
  currency,
  currentPrices,
}: PurchaseListProps) {
  const { t } = useTranslation();

  if (purchases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('noPurchasesYet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {purchases.map(purchase => {
        const currentPrice =
          purchase.itemType === "gold"
            ? currentPrices.gold
            : currentPrices.silver;
        
        // Use precise decimal arithmetic for all calculations
        const pricePerGram = decimalDivide(currentPrice, 31.1034768);
        const estimatedValue = decimalMultiply(pricePerGram, purchase.weight).toNumber();
        const profit = decimalSubtract(estimatedValue, purchase.totalCost).toNumber();
        const profitPercent = decimalMultiply(decimalDivide(profit, purchase.totalCost), 100).toNumber();

        return (
          <div
            key={purchase.id}
            className="bg-muted/50 border border-border rounded-lg p-4 hover:bg-muted/70 transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-primary/20">
                    {t(purchase.itemType)}
                  </span>
                  <span className="font-semibold">{purchase.itemName}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {formatDecimal(purchase.weight, { maxFractionDigits: 8, trimTrailingZeros: true, mode: 'truncate' })}g
                  </span>{" "}
                  @ {formatPriceCeil2(purchase.pricePerGram, currency || undefined)}/g
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('purity')}: <span className="font-medium">{purchase.purity}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('purchased')}:{" "}
                  {new Date(purchase.purchaseDate).toLocaleDateString()}
                </p>
              </div>

              {/* Right Column */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('totalCost')}</p>
                    <p className="font-semibold text-lg">
                      {formatPriceCeil2(purchase.totalCost, currency || undefined)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('estimatedValue')}</p>
                    <p className="font-semibold text-lg text-blue-400">
                      {formatPriceCeil2(estimatedValue, currency || undefined)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('estimatedProfit')}</p>
                    <p
                      className={`font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {profit >= 0 ? "+" : ""}
                      {formatPriceCeil2(profit, currency || undefined)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('return')}</p>
                    <p
                      className={`font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {profit >= 0 ? "+" : ""}
                      {formatDecimal(profitPercent, { maxFractionDigits: 2, trimTrailingZeros: true, mode: 'truncate' })}%
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => onEdit(purchase)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    onClick={() => onDelete(purchase.id)}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    {t('delete')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
