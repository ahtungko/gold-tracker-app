import { useState, useRef } from "react";
import { toast } from "sonner";
import { useGoldPrice } from "@/hooks/useGoldPrice";
import { usePurchases } from "@/hooks/usePurchases";
import PurchaseForm from "@/components/PurchaseForm";
import PurchaseList from "@/components/PurchaseList";
import PurchaseSummary from "@/components/PurchaseSummary";
import { Purchase } from "@/lib/types";
import { useIsMobile } from "@/hooks/useMobile";
import { Button } from "@/components/ui/button";
import { importFromCSV } from "@/lib/storage";
import { GenericDialog } from "@/components/ui/GenericDialog";
import { PageTransition } from "@/lib/animations";
import { PageContainer, SectionHeader } from "@/components/layout";
import { useTranslation } from "react-i18next";

export default function Tracker() {
  const { t } = useTranslation();
  const { currentPrice } = useGoldPrice();
  const {
    purchases,
    addPurchase,
    removePurchase,
    updatePurchase,
    calculateSummary,
    currency,
    refreshPurchases,
  } = usePurchases();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const goldPrice = currentPrice?.xauPrice || 0;
  const silverPrice = currentPrice?.xagPrice || 0;

  const handleAddPurchase = (purchase: Omit<Purchase, "createdAt">) => {
    try {
      addPurchase(purchase);
      toast.success(
        t("purchaseAddedSuccessfully", { itemName: purchase.itemName }),
      );
      if (isMobile) {
        setIsFormVisible(false);
      }
    } catch (error) {
      console.error("Failed to add purchase:", error);
      toast.error(t("failedToAddPurchase"));
    }
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePurchase = (purchase: Omit<Purchase, 'createdAt'>) => {
    if (!editingPurchase) return;
    try {
      updatePurchase(editingPurchase.id, purchase);
      toast.success(
        t("purchaseUpdatedSuccessfully", { itemName: purchase.itemName }),
      );
      setIsEditDialogOpen(false);
      setEditingPurchase(null);
    } catch (error) {
      console.error("Failed to update purchase:", error);
      toast.error(t("failedToUpdatePurchase"));
    }
  };

  const handleDeletePurchase = (id: string) => {
    if (window.confirm(t("areYouSureDeletePurchase"))) {
      try {
        removePurchase(id);
        toast.success(t("purchaseDeletedSuccessfully"));
      } catch (error) {
        console.error("Failed to delete purchase:", error);
        toast.error(t("failedToDeletePurchase"));
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
      toast.success(t("purchasesImportedSuccessfully"));
      if (isMobile) {
        setIsFormVisible(false);
      }
    } catch (error) {
      console.error("Failed to import purchases:", error);
      toast.error(t("failedToImportPurchases"));
    } finally {
      setIsImporting(false);
      input.value = "";
    }
  };

  const summary = calculateSummary(goldPrice, silverPrice);

  return (
    <PageTransition className="flex flex-1 flex-col">
      <PageContainer className="space-y-10">
        <SectionHeader
          title={t("purchaseTracker")}
          description={t("trackYourPurchases")}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            {isMobile ? (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  className="w-full rounded-xl shadow-sm"
                >
                  {isFormVisible ? t("hideForm") : t("addPurchase")}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl shadow-sm"
                  variant="outline"
                  disabled={isImporting}
                >
                  {isImporting ? t("importing") : t("importFromCSV")}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".csv"
                  className="hidden"
                />
                {isFormVisible && (
                  <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
                    <PurchaseForm
                      onSubmit={handleAddPurchase}
                      currency={currency}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
                  <h2 className="mb-6 text-lg font-semibold text-foreground">
                    {t("addPurchase")}
                  </h2>
                  <PurchaseForm onSubmit={handleAddPurchase} currency={currency} />
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl shadow-sm"
                  variant="outline"
                  disabled={isImporting}
                >
                  {isImporting ? t("importing") : t("importFromCSV")}
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

          <div className="space-y-6 lg:col-span-2">
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

            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t("yourPurchases")}
              </h2>
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

        <GenericDialog
          title={t("editPurchase")}
          description={t("updatePurchaseDetails")}
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
      </PageContainer>
    </PageTransition>
  );
}
