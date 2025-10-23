import { Button } from '@/components/ui/button';
import { GoldChart } from '@/components/GoldChart';
import { PriceStats } from '@/components/PriceStats';
import { useGoldPrice, TimeRange } from '@/hooks/useGoldPrice';
import { formatPrice, formatPercentage } from '@/lib/goldApi';

export default function Home() {
  const { currentPrice, historicalData, loading, currency, setCurrency, timeRange, setTimeRange, refetch, hasHistoricalData } =
    useGoldPrice();

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const priceChangeColor = currentPrice && currentPrice.pcXau >= 0 ? 'text-green-400' : 'text-red-400';
  const priceChangeSign = currentPrice && currentPrice.pcXau >= 0 ? '+' : '';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Gold Tracker</h1>
              <p className="text-muted-foreground mt-1">Real-time gold price monitor</p>
            </div>
            <Button
              onClick={refetch}
              disabled={loading}
              variant="outline"
              className="text-primary border-primary hover:bg-primary/10"
            >
              {loading ? 'Updating...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Price Display Section */}
        <div className="bg-card rounded-lg p-8 mb-8 border border-border">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-muted-foreground text-sm mb-2">International Gold Price (XAU)</p>
              {currentPrice && (
                <div>
                  <h2 className="text-5xl font-bold text-primary mb-2">
                    {formatPrice(currentPrice.xauPrice)}
                  </h2>
                  <div className={`text-lg font-semibold ${priceChangeColor}`}>
                    {priceChangeSign}{formatPrice(currentPrice.chgXau)} {formatPercentage(currentPrice.pcXau)}
                  </div>
                </div>
              )}
              {loading && !currentPrice && <div className="text-muted-foreground">Loading price data...</div>}
            </div>

            {/* Currency Selector */}
            <div className="flex gap-2">
              {['MYR', 'USD', 'EUR', 'GBP', 'JPY'].map((curr) => (
                <Button
                  key={curr}
                  onClick={() => handleCurrencyChange(curr)}
                  variant={currency === curr ? 'default' : 'outline'}
                  className={
                    currency === curr
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:bg-primary/10'
                  }
                >
                  {curr}
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Price Info */}
          {currentPrice && (
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-muted-foreground text-sm">Close Price</p>
                <p className="text-lg font-semibold text-primary">{formatPrice(currentPrice.xauClose)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Silver Price (XAG)</p>
                <p className="text-lg font-semibold text-primary">{formatPrice(currentPrice.xagPrice)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Silver Change</p>
                <p className={`text-lg font-semibold ${currentPrice.pcXag >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currentPrice.pcXag >= 0 ? '+' : ''}{formatPrice(currentPrice.chgXag)} {formatPercentage(currentPrice.pcXag)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        {currentPrice && <PriceStats currentPrice={currentPrice} />}

        {/* Chart Section - Only show if historical data is available */}
        {hasHistoricalData && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Price Trend</h3>

              {/* Time Range Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleTimeRangeChange('realtime')}
                  variant={timeRange === 'realtime' ? 'default' : 'outline'}
                  className={
                    timeRange === 'realtime'
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:bg-primary/10'
                  }
                >
                  Real-time
                </Button>
                <Button
                  onClick={() => handleTimeRangeChange('1month')}
                  variant={timeRange === '1month' ? 'default' : 'outline'}
                  className={
                    timeRange === '1month'
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:bg-primary/10'
                  }
                >
                  1 Month
                </Button>
                <Button
                  onClick={() => handleTimeRangeChange('3months')}
                  variant={timeRange === '3months' ? 'default' : 'outline'}
                  className={
                    timeRange === '3months'
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:bg-primary/10'
                  }
                >
                  3 Months
                </Button>
              </div>
            </div>

            <GoldChart data={historicalData} loading={loading} />
          </div>
        )}

        {/* Info Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">About Gold Prices</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Gold prices are quoted per troy ounce in the selected currency. The prices shown are real-time spot prices from
              international markets. Close price represents the previous trading session's closing price. The data is updated
              regularly to provide accurate market information for gold and silver trading.
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">How to Use</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Select your preferred currency using the buttons above the price</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>View real-time gold and silver prices with percentage changes</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Compare current prices with previous closing prices</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Click the Refresh button to get the latest price updates</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

