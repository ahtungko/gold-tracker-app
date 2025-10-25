import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageContainer, SectionHeader } from "@/components/layout";
import { useGoldPrice } from "@/hooks/useGoldPrice";
import { formatPercentage, formatPrice } from "@/lib/goldApi";
import { CURRENCIES } from "@/lib/currencies";
import { PageTransition } from "@/lib/animations";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Unit = "oz" | "gram";

const OZ_TO_GRAM = 31.1035;

export default function Home() {
  const { t } = useTranslation();
  const { currentPrice, loading, currency, setCurrency } = useGoldPrice();
  const [unit, setUnit] = useState<Unit>("gram");

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
  };

  const getDisplayPrice = (price: number) =>
    unit === "gram" ? price / OZ_TO_GRAM : price;

  const getDisplayUnit = () => (unit === "gram" ? "g" : "oz");

  const changeColor = (value: number) =>
    value >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <PageTransition className="flex flex-1 flex-col">
      <PageContainer className="space-y-10">
        <SectionHeader
          title={t("goldSilverTracker")}
          description={t("marketOverviewLead")}
          actions={
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2 py-1 shadow-sm">
              <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
                {t("unit")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleUnitChange("gram")}
                aria-pressed={unit === "gram"}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                  unit === "gram"
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {t("gram")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleUnitChange("oz")}
                aria-pressed={unit === "oz"}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                  unit === "oz"
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {t("ounce")}
              </Button>
            </div>
          }
        />

        <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="flex w-full flex-col gap-2 sm:max-w-sm">
            <label
              htmlFor="currency-select"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t("currency")}
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(event) => handleCurrencyChange(event.target.value)}
              className="h-11 rounded-xl border border-border/60 bg-background/90 px-3 text-sm font-medium text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/60"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>

          {currentPrice ? (
            <div className="mt-6 grid flex-1 gap-3 text-sm text-muted-foreground sm:mt-0 sm:justify-end sm:text-right">
              <div className="font-medium text-foreground">
                {t("updated")}: {" "}
                <span className="font-semibold text-primary">
                  {new Date(currentPrice.timestamp * 1000).toLocaleTimeString()}
                </span>
              </div>
              <div>
                {t("perGram")}: {" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(currentPrice.xauPrice / OZ_TO_GRAM)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-muted-foreground sm:mt-0 sm:text-right">
              {loading ? t("loadingPriceData") : "—"}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
            {currentPrice ? (
              <div className="space-y-6">
                <header className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("goldPriceXAU")} / {currency}
                  </p>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="text-4xl font-semibold text-primary sm:text-5xl">
                      {formatPrice(getDisplayPrice(currentPrice.xauPrice))}
                    </h2>
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        changeColor(currentPrice.chgXau),
                      )}
                    >
                      {currentPrice.chgXau >= 0 ? "+" : ""}
                      {formatPrice(getDisplayPrice(currentPrice.chgXau))}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        changeColor(currentPrice.pcXau),
                      )}
                    >
                      {currentPrice.pcXau >= 0 ? "+" : ""}
                      {formatPercentage(currentPrice.pcXau)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("per")} {getDisplayUnit()}
                  </p>
                </header>

                <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("closePrice")}
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {formatPrice(getDisplayPrice(currentPrice.xauClose))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("updated")}
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {new Date(currentPrice.timestamp * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {loading ? t("loadingPriceData") : "—"}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
            {currentPrice ? (
              <div className="space-y-6">
                <header className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("silverPriceXAG")} / {currency}
                  </p>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="text-4xl font-semibold text-sky-300 sm:text-5xl">
                      {formatPrice(getDisplayPrice(currentPrice.xagPrice))}
                    </h2>
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        changeColor(currentPrice.chgXag),
                      )}
                    >
                      {currentPrice.chgXag >= 0 ? "+" : ""}
                      {formatPrice(getDisplayPrice(currentPrice.chgXag))}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        changeColor(currentPrice.pcXag),
                      )}
                    >
                      {currentPrice.pcXag >= 0 ? "+" : ""}
                      {formatPercentage(currentPrice.pcXag)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("per")} {getDisplayUnit()}
                  </p>
                </header>

                <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("closePrice")}
                    </p>
                    <p className="text-lg font-semibold text-sky-300">
                      {formatPrice(getDisplayPrice(currentPrice.xagClose))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("updated")}
                    </p>
                    <p className="text-lg font-semibold text-sky-300">
                      {new Date(currentPrice.timestamp * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {loading ? t("loadingPriceData") : "—"}
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </PageTransition>
  );
}
