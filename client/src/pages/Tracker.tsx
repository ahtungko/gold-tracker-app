import { useState } from 'react';
import { useGoldPrice } from '@/hooks/useGoldPrice';
import { usePurchases } from '@/hooks/usePurchases';
import PurchaseForm from '@/components/PurchaseForm';
import PurchaseList from '@/components/PurchaseList';
import PurchaseSummary from '@/components/PurchaseSummary';
import { Purchase } from '@/lib/types';

export default function Tracker() {
  const { currentPrice } = useGoldPrice();
  const { purchases, addPurchase, removePurchase, calculateSummary } = usePurchases();
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Extract prices from API response
  const goldPrice = currentPrice?.xauPrice || 0;
  const silverPrice = currentPrice?.xagPrice || 0;

  const handleAddPurchase = (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
    try {
      addPurchase(purchase);
      setSuccessMessage(`${purchase.itemName} added successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to add purchase:', error);
      alert('Failed to add purchase. Please try again.');
    }
  };

  const handleDeletePurchase = (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        removePurchase(id);
        setSuccessMessage('Purchase deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Failed to delete purchase:', error);
        alert('Failed to delete purchase. Please try again.');
      }
    }
  };

  const summary = calculateSummary(goldPrice, silverPrice);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="container py-4">
          <h1 className="text-2xl font-bold text-primary">Purchase Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your gold and silver purchases</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-1">
            <PurchaseForm onSubmit={handleAddPurchase} />
          </div>

          {/* Right Column - List and Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            {purchases.length > 0 && (
              <PurchaseSummary
                purchases={purchases}
                summary={summary}
                currentPrices={{
                  gold: goldPrice,
                  silver: silverPrice,
                }}
              />
            )}

            {/* Purchase List */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Your Purchases</h2>
              <PurchaseList
                purchases={purchases}
                onDelete={handleDeletePurchase}
                currentPrices={{
                  gold: goldPrice,
                  silver: silverPrice,
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

