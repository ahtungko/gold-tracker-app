import { useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useLocation } from 'wouter';
import { useGoldPrice } from '@/hooks/useGoldPrice';
import { usePurchases } from '@/hooks/usePurchases';
import PurchaseForm from '@/components/PurchaseForm';
import PurchaseList from '@/components/PurchaseList';
import PurchaseSummary from '@/components/PurchaseSummary';
import { Purchase } from '@/lib/types';
import { useIsMobile } from '@/hooks/useMobile';
import { Button } from '@/components/ui/button';
import { importFromCSV } from '@/lib/storage';
import { GenericDialog } from '@/components/ui/GenericDialog';
import { PageTransition } from '@/lib/animations';
import { useTranslation } from 'react-i18next';

export default function Tracker() {
  const { t, i18n } = useTranslation();
  const { currentPrice } = useGoldPrice();
  const { purchases, addPurchase, removePurchase, updatePurchase, calculateSummary, currency, refreshPurchases } = usePurchases();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null); // State for the purchase being edited
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State to control edit dialog visibility
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract prices from API response
  const goldPrice = currentPrice?.xauPrice || 0;
  const silverPrice = currentPrice?.xagPrice || 0;

  const navItems = [
    { href: '/', label: t('prices') },
    { href: '/tracker', label: t('tracker') },
  ];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleAddPurchase = (purchase: Omit<Purchase, 'createdAt'>) => {
    try {
      addPurchase(purchase);
      toast.success(t('purchaseAddedSuccessfully', { itemName: purchase.itemName }));
      if (isMobile) {
        setIsFormVisible(false);
      }
    } catch (error) {
      console.error('Failed to add purchase:', error);
      toast.error(t('failedToAddPurchase'));
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
      toast.success(t('purchaseUpdatedSuccessfully', { itemName: purchase.itemName }));
      setIsEditDialogOpen(false);
      setEditingPurchase(null);
    } catch (error) {
      console.error('Failed to update purchase:', error);
      toast.error(t('failedToUpdatePurchase'));
    }
  };

  const handleDeletePurchase = (id: string) => {
    if (window.confirm(t('areYouSureDeletePurchase'))) {
      try {
        removePurchase(id);
        toast.success(t('purchaseDeletedSuccessfully'));
      } catch (error) {
        console.error('Failed to delete purchase:', error);
        toast.error(t('failedToDeletePurchase'));
      }
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await importFromCSV(file);
      refreshPurchases();
      toast.success(t('purchasesImportedSuccessfully'));
      if (isMobile) {
        setIsFormVisible(false);
      }
    } catch (error) {
      console.error('Failed to import purchases:', error);
      toast.error(t('failedToImportPurchases'));
    } finally {
      setIsImporting(false);
      input.value = '';
    }
  };

  const summary = calculateSummary(goldPrice, silverPrice);

  return (
    <PageTransition className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              aria-label={t('prices')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            <h1 className="text-2xl font-bold text-primary flex-1 min-w-[200px]">{t('purchaseTracker')}</h1>
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
                <label htmlFor="tracker-language-select" className="sr-only">
                  {t('language')}
                </label>
                <select
                  id="tracker-language-select"
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
          <p className="text-sm text-muted-foreground">{t('trackYourPurchases')}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 pb-28 md:pb-12">
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
                onEdit={handleEditPurchase}
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
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingPurchase(null);
          }}
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
    </PageTransition>
  );
}
