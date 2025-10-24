import { Purchase, PurchaseSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/goldApi";
import { exportToCSV, generateExportFilename } from "@/lib/storage";

interface PurchaseSummaryProps {
  purchases: Purchase[];
  summary: PurchaseSummary;
  currency: string | null;
  currentPrices: {
    gold: number;
    silver: number;
  };
}

export default function PurchaseSummaryComponent({
  purchases,
  summary,
  currency,
  currentPrices,
}: PurchaseSummaryProps) {
  const handleExport = (itemType: "gold" | "silver" | "all") => {
    const filtered =
      itemType === "all"
        ? purchases
        : purchases.filter(p => p.itemType === itemType);

    if (filtered.length === 0) {
      alert(`No ${itemType} purchases to export`);
      return;
    }

    const filename = generateExportFilename(itemType);
    exportToCSV(filtered, filename);
  };

  const goldPurchases = purchases.filter(p => p.itemType === "gold");
  const silverPurchases = purchases.filter(p => p.itemType === "silver");

  const goldSummary = calculateSummary(goldPurchases, currentPrices.gold);
  const silverSummary = calculateSummary(silverPurchases, currentPrices.silver);

  return (
    <div className="space-y-6">
      {/* Gold Summary */}
      {goldPurchases.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-yellow-400">Gold Holdings</h4>
            <Button
              onClick={() => handleExport("gold")}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Export Gold
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Weight</p>
              <p className="font-semibold">
                {goldSummary.totalWeight.toFixed(2)}g
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Cost</p>
              <p className="font-semibold">
                {formatPrice(goldSummary.totalCost, currency || undefined)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Est. Value</p>
              <p className="font-semibold text-blue-400">
                {formatPrice(goldSummary.estimatedValue, currency || undefined)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Est. Profit</p>
              <p
                className={`font-semibold ${goldSummary.estimatedProfit >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {goldSummary.estimatedProfit >= 0 ? "+" : ""}
                {formatPrice(goldSummary.estimatedProfit, currency || undefined)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Silver Summary */}
      {silverPurchases.length > 0 && (
        <div className="bg-slate-400/10 border border-slate-400/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-300">Silver Holdings</h4>
            <Button
              onClick={() => handleExport("silver")}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Export Silver
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Weight</p>
              <p className="font-semibold">
                {silverSummary.totalWeight.toFixed(2)}g
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Cost</p>
              <p className="font-semibold">
                {formatPrice(silverSummary.totalCost, currency || undefined)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Est. Value</p>
              <p className="font-semibold text-blue-400">
                {formatPrice(silverSummary.estimatedValue, currency || undefined)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Est. Profit</p>
              <p
                className={`font-semibold ${silverSummary.estimatedProfit >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {silverSummary.estimatedProfit >= 0 ? "+" : ""}
                {formatPrice(silverSummary.estimatedProfit, currency || undefined)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export All Button */}
      {purchases.length > 0 && (
        <Button
          onClick={() => handleExport("all")}
          variant="default"
          className="w-full"
        >
          Export All Purchases to CSV
        </Button>
      )}
    </div>
  );
}

/**
 * Calculate summary statistics for a set of purchases
 */
function calculateSummary(
  purchases: Purchase[],
  currentPrice: number
): PurchaseSummary {
  const totalWeight = purchases.reduce((sum, p) => sum + p.weight, 0);
  const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);
  const estimatedValue = totalWeight * (currentPrice / 31.1034768);
  const estimatedProfit = estimatedValue - totalCost;

  return {
    totalWeight,
    totalCost,
    estimatedValue,
    estimatedProfit,
    itemCount: purchases.length,
  };
}
