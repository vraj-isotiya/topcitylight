import { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Upload, Download, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerDetails } from "@/components/customers/CustomerDetails";
import { ImportCustomersDialog } from "@/components/customers/ImportCustomersDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTranslation } from "@/hooks/useTranslation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Customers = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/customers/all");
      if (data?.success) {
        const responseData = data.data || {};
        setCustomers(
          Array.isArray(responseData.customers) ? responseData.customers : []
        );
      } else {
        throw new Error(data?.message || "Failed to fetch customers");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleSaveCustomer = async (customerData: any) => {
    try {
      let customerId = selectedCustomer?.id;
      const selectedProducts: string[] = customerData.selectedProducts || [];

      // Remove selectedProducts from payload before sending customer request
      const customerPayload = { ...customerData };
      delete customerPayload.selectedProducts;

      if (selectedCustomer) {
        // Update customer
        const { data } = await axiosClient.patch(
          `/customers/${customerId}`,
          customerPayload
        );
        if (!data?.success) throw new Error(data?.message || "Update failed");
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        // Create customer
        const { data } = await axiosClient.post(
          "/customers/add",
          customerPayload
        );
        if (!data?.success) throw new Error(data?.message || "Create failed");

        // try to read created id from multiple likely paths
        customerId = data.data?.id ?? data.data?.customer?.id ?? data.data;
        if (!customerId) {
          // defensive: if backend didn't return id, throw so dev can inspect response
          console.error("Create response:", data);
          throw new Error("Could not determine created customer id");
        }
        toast({
          title: "Success",
          description: "Customer created successfully",
        });

        // Add all selected products for a newly created customer (no diff needed)
        if (selectedProducts.length > 0) {
          await Promise.all(
            selectedProducts.map((productId) =>
              axiosClient.post(`/customer-products/add`, {
                customer_id: customerId,
                product_id: productId,
              })
            )
          );
        }
      }

      // If updating an existing customer, sync only the differences
      if (selectedCustomer && customerId) {
        // Fetch existing product links
        const existingRes = await axiosClient.get(
          `/customer-products/${customerId}`
        );
        const existingProductIds =
          existingRes.data?.data?.products.map((p: any) => p.product_id) || [];

        // Compute toAdd and toRemove
        const toAdd = selectedProducts.filter(
          (id) => !existingProductIds.includes(id)
        );
        const toRemove = existingProductIds.filter(
          (id) => !selectedProducts.includes(id)
        );

        // Remove deselected
        if (toRemove.length > 0) {
          await Promise.all(
            toRemove.map((productId) =>
              axiosClient.delete(
                `/customer-products/${customerId}/${productId}`
              )
            )
          );
        }

        // Add newly selected
        if (toAdd.length > 0) {
          await Promise.all(
            toAdd.map((productId) =>
              axiosClient.post(`/customer-products/add`, {
                customer_id: customerId,
                product_id: productId,
              })
            )
          );
        }
      }

      // refresh UI
      await fetchCustomers();
      //  Refresh selected customer if it’s currently open
      if (
        customerId &&
        selectedCustomer &&
        selectedCustomer.id === customerId
      ) {
        try {
          const updated = await axiosClient.get(`/customers/${customerId}`);
          if (updated.data?.success) {
            setSelectedCustomer(updated.data.data); // refresh right panel instantly
          }
        } catch (err) {
          console.error("Error refreshing selected customer:", err);
        }
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Operation failed",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (!customers || customers.length === 0) return;

    const excludedFields = ["id", "created_at", "updated_at"];

    // Step 1: Transform data for export
    const formattedData = customers.map((customer) => {
      const row: Record<string, any> = {};

      Object.entries(customer).forEach(([key, value]) => {
        if (excludedFields.includes(key)) return;

        if (key === "products" && Array.isArray(value)) {
          // Include only active products
          const activeProducts = value
            .filter((p: any) => p.is_active)
            .map((p: any) => `${p.product_name || "null"}`)
            .join("; ");

          row["products"] = activeProducts || "null";
        } else {
          if (value === undefined || value === null || value === "") {
            row[key] = "null"; //  Explicitly write null
          } else if (typeof value === "number") {
            // Keep numbers safe for Excel
            row[key] = `="${value}"`;
          } else {
            row[key] = String(value);
          }
        }
      });

      return row;
    });

    // Step 2: Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    // Step 3: Auto-fit column widths (based on longest text)
    const columnWidths = Object.keys(formattedData[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...formattedData.map((row) =>
          String(row[key] || "").length > 0
            ? String(row[key]).length
            : key.length
        )
      ),
    }));
    worksheet["!cols"] = columnWidths;

    // Step 4: Generate Excel and trigger download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "customers.xlsx");
  };

  const filteredCustomers = customers.filter((customer) =>
    Object.values(customer).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("customers")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            {t("importCSV")}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            {t("export")}
          </Button>
          <Button onClick={handleAddCustomer}>
            <Plus className="w-4 h-4 mr-2" />
            {t("addNewCustomer")}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("searchCustomers")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CustomerTable
            customers={paginatedCustomers}
            onSelectCustomer={setSelectedCustomer}
            onEditCustomer={handleEditCustomer}
            loading={loading}
          />
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={filteredCustomers.length}
          />
        </div>
        <div>
          {selectedCustomer && (
            <CustomerDetails
              customer={selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
            />
          )}
        </div>
      </div>

      <CustomerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
      />

      <ImportCustomersDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={fetchCustomers}
      />
    </div>
  );
};

export default Customers;
