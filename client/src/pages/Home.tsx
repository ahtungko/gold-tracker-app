import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useGoldPrice } from '@/hooks/useGoldPrice';
import { formatPrice, formatPercentage } from '@/lib/goldApi';
import { CURRENCIES } from '@/lib/currencies';
import { useTranslation } from 'react-i18next';

type Unit = 'oz' | 'gram';

export default function Home() {
  const { t, i18n } = useTranslation();
  const { currentPrice, loading, currency, setCurrency } = useGoldPrice();
  const [location] = useLocation();
  const [unit, setUnit] = useState<Unit>('gram');

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const navItems = [
    { href: '/', label: t('prices') },
    { href: '/tracker', label: t('tracker') },
  ];

  // Convert oz to gram (1 oz = 31.1035 grams)
  const OZ_TO_GRAM = 31.1035;

  const getDisplayPrice = (price: number) => {
    return unit === 'gram' ? price / OZ_TO_GRAM : price;
  };

  const getDisplayUnit = () => {
    return unit === 'gram' ? 'g' : 'oz';
  };

  return (
    <PageTransition className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-primary flex-1 min-w-[200px]">{t('goldSilverTracker')}</h1>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <nav className="hidden md:flex items-center gap-4" aria-label={t('primaryNavigation')}>
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="w-full sm:w-auto min-w-[140px]">
                <label htmlFor="home-language-select" className="sr-only">
                  {t('language')}
                </label>
                <select
                  id="home-language-select"
                  value={i18n.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 pb-28 md:pb-12">
        {/* Controls Section */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Currency Selector */}
          <div className="flex gap-2 items-center">
            <label htmlFor="currency-select" className="text-sm text-muted-foreground">
              {t('currency')}:
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-md border border-border bg-background text-foreground hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Selector */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center">{t('unit')}:</span>
            <Button
              onClick={() => handleUnitChange('gram')}
              variant={unit === 'gram' ? 'default' : 'outline'}
              size="sm"
              className={
                unit === 'gram'
                  ? 'bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:bg-primary/10'
              }
            >
              {t('gram')}
            </Button>
            <Button
              onClick={() => handleUnitChange('oz')}
              variant={unit === 'oz' ? 'default' : 'outline'}
              size="sm"
              className={
                unit === 'oz'
                  ? 'bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:bg-primary/10'
              }
            >
              {t('ounce')}
            </Button>
          </div>
        </div>

        {/* Price Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Gold Card */}
          <div className="bg-card rounded-lg p-8 border border-border">
            {currentPrice && (
              <div>
                <p className="text-muted-foreground text-sm mb-4">{t('goldPriceXAU')} / {currency}</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-4xl font-bold text-primary">
                      {formatPrice(getDisplayPrice(currentPrice.xauPrice))}
                    </h2>
                    <p className={`text-lg font-semibold ${currentPrice.chgXau >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentPrice.chgXau >= 0 ? '+' : ''}{formatPrice(getDisplayPrice(currentPrice.chgXau))}
                    </p>
                    <p className={`text-lg font-semibold ${currentPrice.pcXau >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentPrice.pcXau >= 0 ? '+' : ''}{formatPercentage(currentPrice.pcXau)}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">{t('per')} {getDisplayUnit()}</p>
                </div>

                {/* Additional Gold Info */}
                <div className="border-t border-border pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{t('closePrice')}</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatPrice(getDisplayPrice(currentPrice.xauClose))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{t('updated')}</p>
                      <p className="text-lg font-semibold text-primary">
                        {new Date(currentPrice.timestamp * 1000).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {loading && !currentPrice && <div className="text-muted-foreground">{t('loadingPriceData')}</div>}
          </div>

          {/* Silver Card */}
          <div className="bg-card rounded-lg p-8 border border-border">
            {currentPrice && (
              <div>
                <p className="text-muted-foreground text-sm mb-4">{t('silverPriceXAG')} / {currency}</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-4xl font-bold text-blue-300">
                      {formatPrice(getDisplayPrice(currentPrice.xagPrice))}
                    </h2>
                    <p className={`text-lg font-semibold ${currentPrice.chgXag >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentPrice.chgXag >= 0 ? '+' : ''}{formatPrice(getDisplayPrice(currentPrice.chgXag))}
                    </p>
                    <p className={`text-lg font-semibold ${currentPrice.pcXag >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentPrice.pcXag >= 0 ? '+' : ''}{formatPercentage(currentPrice.pcXag)}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">{t('per')} {getDisplayUnit()}</p>
                </div>

                {/* Additional Silver Info */}
                <div className="border-t border-border pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{t('closePrice')}</p>
                      <p className="text-lg font-semibold text-blue-300">
                        {formatPrice(getDisplayPrice(currentPrice.xagClose))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{t('updated')}</p>
                      <p className="text-lg font-semibold text-blue-300">
                        {new Date(currentPrice.timestamp * 1000).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {loading && !currentPrice && <div className="text-muted-foreground">{t('loadingPriceData')}</div>}
          </div>
        </div>


      </main>
    </PageTransition>
  );
}

