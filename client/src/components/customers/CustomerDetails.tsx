import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { CommunicationHistory } from "./CommunicationHistory";
import { useTranslation } from "@/hooks/useTranslation";

interface CustomerDetailsProps {
  customer: any;
  onClose: () => void;
}

export const CustomerDetails = ({
  customer,
  onClose,
}: CustomerDetailsProps) => {
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{customer.name}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">{t("details")}</TabsTrigger>
            <TabsTrigger value="history">{t("history")}</TabsTrigger>
            <TabsTrigger value="notes">{t("notes")}</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">
                {t("contactInformation")}
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p>{customer.address || "N/A"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Phone Number:</span>
                    <p>{customer.phone || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fax:</span>
                    <p>{customer.fax || "N/A"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Country:</span>
                    <p>{customer.country || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Province:</span>
                    <p>{customer.province || "N/A"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">City:</span>
                    <p>{customer.city || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Postal Code:</span>
                    <p>{customer.postal_code || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">{t("bankDetails")}</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Bank Name:</span>
                  <p>{customer.bank_name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Account:</span>
                  <p>{customer.bank_account || "N/A"}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">
                {t("businessInformation")}
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Product:</span>
                  <p>
                    {Array.isArray(customer.products) &&
                    customer.products.length > 0
                      ? customer.products
                          .filter((p) => p.is_active)
                          .map((p) => p.product_name)
                          .join(", ") || "N/A"
                      : "N/A"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Source:</span>
                    <p>{customer.customer_source_name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p>{customer.business_type_name || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Website:</span>
                  <p>{customer.website || "N/A"}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">
                {t("contactPerson")}
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p>{customer.contact_person_name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p>{customer.contact_person_email || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p>{customer.contact_person_phone || "N/A"}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history">
            <CommunicationHistory customerId={customer.id} />
          </TabsContent>
          <TabsContent value="notes">
            <p className="text-sm text-muted-foreground">
              {customer.notes || t("noNotesAvailable")}
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
