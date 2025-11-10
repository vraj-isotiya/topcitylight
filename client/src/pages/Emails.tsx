import { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

  // Effects
  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchEmails(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  //  Fetch all customers (for compose dropdown)
  const fetchCustomers = async () => {
    try {
      const res = await axiosClient.get("/customers/all");
      if (res.data?.success && Array.isArray(res.data.data?.customers)) {
        setCustomers(res.data.data.customers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  //  Fetch all email threads (paginated)
  const fetchEmails = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(
        `/mail/all?page=${page}&limit=${limit}`
      );
      if (res.data?.success) {
        const threads = res.data.data?.threads || [];
        setEmails(threads);
        setPagination(res.data.data?.pagination || null);
      } else {
        setEmails([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      setEmails([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleReply = (thread: any) => {
    setIsComposeOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold">{t("emails")}</h1>
        <Button
          onClick={() => setIsComposeOpen(true)}
          className="whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("composeEmail")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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
          <EmailList emails={emails} onReply={handleReply} />

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
