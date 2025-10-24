import { Purchase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/goldApi";

interface PurchaseListProps {
  purchases: Purchase[];
  onDelete: (id: string) => void;
  currency: string | null;
  currentPrices: {
    gold: number;
    silver: number;
  };
}

export default function PurchaseList({
  purchases,
  onDelete,
  currency,
  currentPrices,
}: PurchaseListProps) {
  if (purchases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No purchases recorded yet. Add your first purchase above!</p>
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
        const estimatedValue = (currentPrice / 31.1034768) * purchase.weight;
        const profit = estimatedValue - purchase.totalCost;
        const profitPercent = (profit / purchase.totalCost) * 100;

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
                    {purchase.itemType}
                  </span>
                  <span className="font-semibold">{purchase.itemName}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {purchase.weight.toFixed(2)}g
                  </span>{" "}
                  @ {formatPrice(purchase.pricePerGram, currency || undefined)}/g
                </p>
                <p className="text-sm text-muted-foreground">
                  Purity: <span className="font-medium">{purchase.purity}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Purchased:{" "}
                  {new Date(purchase.purchaseDate).toLocaleDateString()}
                </p>
              </div>

              {/* Right Column */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                    <p className="font-semibold text-lg">
                      {formatPrice(purchase.totalCost, currency || undefined)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Est. Value</p>
                    <p className="font-semibold text-lg text-blue-400">
                      {formatPrice(estimatedValue, currency || undefined)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Profit</p>
                    <p
                      className={`font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {profit >= 0 ? "+" : ""}
                      {formatPrice(profit, currency || undefined)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Return</p>
                    <p
                      className={`font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {profit >= 0 ? "+" : ""}
                      {profitPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => onDelete(purchase.id)}
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
