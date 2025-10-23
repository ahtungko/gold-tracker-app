import { GoldPrice, formatPrice } from "@/lib/goldApi";

interface PriceStatsProps {
  currentPrice: GoldPrice | null;
}

export function PriceStats({ currentPrice }: PriceStatsProps) {
  if (!currentPrice) {
    return null;
  }

  const perGram = currentPrice.xauPrice / 31.1034768;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
          Change (XAU)
        </p>
        <p
          className={`text-lg font-semibold ${currentPrice.chgXau >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {currentPrice.chgXau >= 0 ? "+" : ""}
          {formatPrice(currentPrice.chgXau)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatPrice(currentPrice.pcXau)}%
        </p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
          Close Price
        </p>
        <p className="text-lg font-semibold text-primary">
          {formatPrice(currentPrice.xauClose)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Previous</p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
          Per Gram
        </p>
        <p className="text-lg font-semibold text-primary">
          {formatPrice(perGram)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">1 gram</p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
          Silver (XAG)
        </p>
        <p
          className={`text-lg font-semibold ${currentPrice.chgXag >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {formatPrice(currentPrice.xagPrice)}
        </p>
        <p
          className={`text-xs ${currentPrice.pcXag >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {currentPrice.pcXag >= 0 ? "+" : ""}
          {formatPrice(currentPrice.pcXag)}%
        </p>
      </div>
    </div>
  );
}
