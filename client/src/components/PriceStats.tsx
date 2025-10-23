import { GoldPrice } from '@/lib/goldApi';

interface PriceStatsProps {
  currentPrice: GoldPrice | null;
}

export function PriceStats({ currentPrice }: PriceStatsProps) {
  if (!currentPrice) {
    return null;
  }

  const spread = currentPrice.ask - currentPrice.bid;
  const spreadPercentage = (spread / currentPrice.price) * 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Spread</p>
        <p className="text-lg font-semibold text-primary">${spread.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">{spreadPercentage.toFixed(3)}%</p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Mid Price</p>
        <p className="text-lg font-semibold text-primary">
          ${((currentPrice.ask + currentPrice.bid) / 2).toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Average</p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Per Gram</p>
        <p className="text-lg font-semibold text-primary">${(currentPrice.price / 31.1035).toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">1 gram</p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Updated</p>
        <p className="text-lg font-semibold text-primary">
          {new Date(currentPrice.timestamp * 1000).toLocaleTimeString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Just now</p>
      </div>
    </div>
  );
}

