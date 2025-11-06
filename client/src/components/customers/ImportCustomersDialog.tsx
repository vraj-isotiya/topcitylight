import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { useTranslation } from "@/hooks/useTranslation";

interface ImportCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const ImportCustomersDialog = ({
  open,
  onOpenChange,
  onImportComplete,
}: ImportCustomersDialogProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResult) => {
        const { data: { user } } = await supabase.auth.getUser();
        let successCount = 0;
        let failedCount = 0;

        // Process in batches
        const batchSize = 50;
        for (let i = 0; i < parseResult.data.length; i += batchSize) {
          const batch = parseResult.data.slice(i, i + batchSize);
          const customersToInsert = batch.map((row: any) => ({
            customer_code: row.customer_code || row["Customer Code"] || "",
            name: row.name || row.Name,
            email: row.email || row.Email,
            phone: row.phone || row.Phone,
            company: row.company || row.Company,
            address: row.address || row.Address,
            city: row.city || row.City,
            province: row.province || row.Province,
            country: row.country || row.Country,
            postal_code: row.postal_code || row["Postal Code"],
            fax: row.fax || row.Fax,
            bank_name: row.bank_name || row["Bank Name"],
            bank_account: row.bank_account || row["Bank Account"],
            product: row.product || row.Product,
            customer_source: row.customer_source || row["Customer Source"],
            business_type: row.business_type || row["Business Type"],
            website: row.website || row.Website,
            contact_person_name: row.contact_person_name || row["Contact Person Name"],
            contact_person_email: row.contact_person_email || row["Contact Person Email"],
            contact_person_phone: row.contact_person_phone || row["Contact Person Phone"],
            notes: row.notes || row.Notes,
            status: row.status || row.Status || "Lead",
            created_by: user?.id,
          }));

          const { error } = await supabase.from("customers").insert(customersToInsert);

          if (error) {
            failedCount += batch.length;
            console.error("Batch import error:", error);
          } else {
            successCount += batch.length;
          }
        }

        setResults({ success: successCount, failed: failedCount });
        setImporting(false);

        toast({
          title: "Import Complete",
          description: `Successfully imported ${successCount} customers. ${failedCount} failed.`,
        });

        if (successCount > 0) {
          onImportComplete();
        }
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
        setImporting(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importCustomersFromCSV")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with customer data
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button disabled={importing} asChild>
                <span>{importing ? "Importing..." : "Choose File"}</span>
              </Button>
            </label>
          </div>

          {results && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{results.success} customers imported successfully</span>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>{results.failed} customers failed to import</span>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p className="font-semibold mb-2">CSV Format:</p>
            <p>Include columns: name, email, phone, company, address, city, province, country, postal_code, fax, bank_name, bank_account, product, customer_source, business_type, website, contact_person_name, contact_person_email, contact_person_phone, notes, status</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
