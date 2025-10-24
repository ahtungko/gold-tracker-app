import { useState, useRef } from 'react';
import { useGoldPrice } from '@/hooks/useGoldPrice';
import { usePurchases } from '@/hooks/usePurchases';
import PurchaseForm from '@/components/PurchaseForm';
import PurchaseList from '@/components/PurchaseList';
import PurchaseSummary from '@/components/PurchaseSummary';
import { Purchase } from '@/lib/types';
import { useIsMobile } from '@/hooks/useMobile';
import { Button } from '@/components/ui/button';
import { importFromCSV } from '@/lib/storage';
import { GenericDialog } from '@/components/ui/GenericDialog'; // Import GenericDialog
import { useTranslation } from 'react-i18next';

export default function Tracker() {
  const { t } = useTranslation();
  const { currentPrice } = useGoldPrice();
  const { purchases, addPurchase, removePurchase, updatePurchase, calculateSummary, currency } = usePurchases();
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null); // State for the purchase being edited
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State to control edit dialog visibility
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract prices from API response
  const goldPrice = currentPrice?.xauPrice || 0;
  const silverPrice = currentPrice?.xagPrice || 0;

  const handleAddPurchase = (purchase: Omit<Purchase, 'createdAt'>) => {
    try {
      addPurchase(purchase);
      setSuccessMessage(t('purchaseAddedSuccessfully', { itemName: purchase.itemName }));
      setTimeout(() => setSuccessMessage(''), 3000);
      if (isMobile) {
        setIsFormVisible(false);
      }
    } catch (error) {
      console.error('Failed to add purchase:', error);
      alert(t('failedToAddPurchase'));
    }
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePurchase = (purchase: Purchase) => {
    if (!editingPurchase) return;
    try {
      updatePurchase(editingPurchase.id, purchase);
      setSuccessMessage(t('purchaseUpdatedSuccessfully', { itemName: purchase.itemName }));
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditDialogOpen(false);
      setEditingPurchase(null);
    } catch (error) {
      console.error('Failed to update purchase:', error);
      alert(t('failedToUpdatePurchase'));
    }
  };

  const handleDeletePurchase = (id: string) => {
    if (window.confirm(t('areYouSureDeletePurchase'))) {
      try {
        removePurchase(id);
        setSuccessMessage(t('purchaseDeletedSuccessfully'));
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Failed to delete purchase:', error);
        alert(t('failedToDeletePurchase'));
      }
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await importFromCSV(file);
      setSuccessMessage(t('purchasesImportedSuccessfully'));
      setTimeout(() => {
        setSuccessMessage('');
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to import purchases:', error);
      alert(t('failedToImportPurchases'));
    } finally {
      setIsImporting(false);
    }
  };

  const summary = calculateSummary(goldPrice, silverPrice);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="container py-4">
          <div className="flex items-center space-x-4">            <a href="/" className="text-primary hover:text-primary/80 transition-colors">              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>            </a>            <h1 className="text-2xl font-bold text-primary">{t('purchaseTracker')}</h1>          </div>
          <p className="text-sm text-muted-foreground mt-1">{t('trackYourPurchases')}</p>
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
            {isMobile ? (
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  className="w-full"
                >
                  {isFormVisible ? t('hideForm') : t('addPurchase')}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                  disabled={isImporting}
                >
                  {isImporting ? t('importing') : t('importFromCSV')}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".csv"
                  className="hidden"
                />
                {isFormVisible && <PurchaseForm onSubmit={handleAddPurchase} currency={currency} />}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <PurchaseForm onSubmit={handleAddPurchase} currency={currency} />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                  disabled={isImporting}
                >
                  {isImporting ? t('importing') : t('importFromCSV')}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".csv"
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Right Column - List and Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            {purchases.length > 0 && (
              <PurchaseSummary
                purchases={purchases}
                summary={summary}
                currency={currency}
                currentPrices={{
                  gold: goldPrice,
                  silver: silverPrice,
                }}
              />
            )}

            {/* Purchase List */}
            <div>
              <h2 className="text-lg font-semibold mb-4">{t('yourPurchases')}</h2>
              <PurchaseList
                purchases={purchases}
                onDelete={handleDeletePurchase}
                onEdit={handleEditPurchase} // Pass the new handler
                currency={currency}
                currentPrices={{
                  gold: goldPrice,
                  silver: silverPrice,
                }}
              />
            </div>
          </div>
        </div>

        {/* Edit Purchase Dialog */}
        <GenericDialog
          title={t('editPurchase')}
          description={t('updatePurchaseDetails')}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        >
          {editingPurchase && (
            <PurchaseForm
              initialPurchase={editingPurchase}
              onSubmit={handleUpdatePurchase}
              currency={currency}
            />
          )}
        </GenericDialog>
      </main>
    </div>
  );
}
