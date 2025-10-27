import { GoldPrice, formatPriceCeil2, formatPercentage } from "@/lib/goldApi";
import { useTranslation } from 'react-i18next';
import { decimalDivide } from '@/lib/decimal';
import { GRAMS_PER_TROY_OUNCE } from '@shared/const';

interface PriceStatsProps {
  currentPrice: GoldPrice | null;
}

export function PriceStats({ currentPrice }: PriceStatsProps) {
  const { t } = useTranslation();

  if (!currentPrice) {
    return null;
  }

  const perGram = decimalDivide(currentPrice.xauPrice, GRAMS_PER_TROY_OUNCE).toNumber();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
          {t('changeXAU')}
        </p>
        <p
          className={`text-lg font-semibold ${currentPrice.chgXau >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {currentPrice.chgXau >= 0 ? "+" : ""}
          {formatPriceCeil2(currentPrice.chgXau)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatPercentage(currentPrice.pcXau)}
        </p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
          {t('closePrice')}
        </p>
        <p className="text-lg font-semibold text-primary">
          {formatPriceCeil2(currentPrice.xauClose)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{t('previous')}</p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
          {t('perGram')}
        </p>
        <p className="text-lg font-semibold text-primary">
          {formatPriceCeil2(perGram)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{t('oneGram')}</p>
      </div>

      <div className="bg-card/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
          {t('silverXAG')}
        </p>
        <p
          className={`text-lg font-semibold ${currentPrice.chgXag >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {formatPriceCeil2(currentPrice.xagPrice)}
        </p>
        <p
          className={`text-xs ${currentPrice.pcXag >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {currentPrice.pcXag >= 0 ? "+" : ""}
          {formatPercentage(currentPrice.pcXag)}
        </p>
      </div>
    </div>
  );
}
