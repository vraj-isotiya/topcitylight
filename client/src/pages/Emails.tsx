import { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ComposeEmailDialog } from "@/components/emails/ComposeEmailDialog";
import { EmailList } from "@/components/emails/EmailList";
import { useTranslation } from "@/hooks/useTranslation";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";

const Emails = () => {
  const { t } = useTranslation();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
    fetchEmails(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  //  Fetch customers list
  const fetchCustomers = async () => {
    try {
      const res = await axiosClient.get("/customers/all");
      if (res.data?.success && Array.isArray(res.data.data?.customers)) {
        setCustomers(res.data.data.customers);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  //  Fetch emails from backend
  const fetchEmails = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(
        `/mail/all?page=${page}&limit=${limit}`
      );

      if (res.data?.success) {
        const threads = res.data.data?.threads || [];
        const paginationData = res.data.data?.pagination || {};
        setEmails(threads);
        setPagination(paginationData);
      } else {
        setEmails([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  //  Pagination handlers
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };
  console.log(emails);
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("emails")}</h1>
        <Button onClick={() => setIsComposeOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t("composeEmail")}
        </Button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Email List */}
          <EmailList emails={emails} />

          {/* Pagination */}
          {pagination && (
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={pagination.pageSize}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalItems={pagination.totalItems}
            />
          )}
        </>
      )}

      {/* Compose Email Dialog */}
      <ComposeEmailDialog
        open={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        customers={customers}
        onEmailSent={() => fetchEmails(currentPage, itemsPerPage)}
      />
    </div>
  );
};

export default Emails;
