import { useEffect, useState } from "react";
import { Mail, Reply, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ComposeReplyDialog } from "./ComposeReplyDialog";
import axiosClient from "@/lib/axiosClient";
import DOMPurify from "dompurify";

interface CommunicationHistoryProps {
  customerId: string;
}

interface EmailThread {
  id: string;
  subject: string;
  body: string;
  sent_at: string;
  sent_by: { name: string; email: string };
  customer: { name: string; email: string };
  replies: {
    reply_body: string;
    sender_email: string;
    received_at: string;
  }[];
  expanded: boolean;
}

export const CommunicationHistory = ({
  customerId,
}: CommunicationHistoryProps) => {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (!customerId) return;
    fetchCustomer();
    fetchCommunications();
  }, [customerId]);

  // Fetch customer details
  const fetchCustomer = async () => {
    try {
      const res = await axiosClient.get(`/customers/${customerId}`);
      if (res.data?.success) setCustomer(res.data.data);
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  // Fetch email threads
  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/mail/thread/${customerId}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const threadsData = res.data.data.map((thread: any) => ({
          id: thread.id,
          subject: thread.subject,
          body: DOMPurify.sanitize(thread.body || ""),
          sent_at: thread.sent_at,
          sent_by: thread.sent_by,
          customer: thread.customer,
          replies: (thread.replies || []).map((r: any) => ({
            reply_body: DOMPurify.sanitize(r.reply_body || ""),
            sender_email: r.sender_email,
            received_at: r.received_at,
          })),
          expanded: false,
        }));
        setThreads(threadsData);
      } else setThreads([]);
    } catch (error) {
      console.error("Error fetching communications:", error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleThread = (id: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t))
    );
  };

  const handleReply = (email: any) => {
    setSelectedEmail(email);
    setReplyDialogOpen(true);
  };

  const handleNewEmail = () => {
    setSelectedEmail(null);
    setReplyDialogOpen(true);
  };

  //  Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Skeleton className="h-9 w-28" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </Card>
        ))}
      </div>
    );
  }

  //  No threads
  if (threads.length === 0) {
    return (
      <>
        <div className="flex justify-end mb-4">
          <Button onClick={handleNewEmail} size="sm">
            <Send className="w-4 h-4 mr-2" /> New Email
          </Button>
        </div>
        <Card className="p-8 text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No communications yet</p>
        </Card>
        <ComposeReplyDialog
          open={replyDialogOpen}
          onOpenChange={setReplyDialogOpen}
          customer={customer}
          originalEmail={selectedEmail}
          onEmailSent={fetchCommunications}
        />
      </>
    );
  }

  //  Threads UI
  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleNewEmail}
          size="sm"
          className="flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Send className="w-4 h-4" />{" "}
          <span className="text-sm">New Email</span>
        </Button>
      </div>

      <div className="space-y-3">
        {threads.map((thread) => (
          <Card
            key={thread.id}
            className={cn(
              "transition-all duration-200 hover:shadow-md overflow-hidden",
              thread.expanded && "shadow-lg border-primary/30"
            )}
          >
            <div
              className="p-3 sm:p-4 cursor-pointer"
              onClick={() => toggleThread(thread.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Mail
                    className={cn(
                      "w-5 h-5 mt-0.5 flex-shrink-0",
                      thread.replies.length > 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h5 className="font-semibold text-sm truncate max-w-[200px] sm:max-w-none">
                        {thread.subject}
                      </h5>
                      {thread.replies.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {thread.replies.length}{" "}
                          {thread.replies.length === 1 ? "reply" : "replies"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(thread.sent_at).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {!thread.expanded && (
                      <p
                        className="text-sm text-muted-foreground mt-2 line-clamp-2 break-words"
                        dangerouslySetInnerHTML={{ __html: thread.body }}
                      />
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="self-end sm:self-auto"
                >
                  {thread.expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {thread.expanded && (
              <div className="border-t overflow-x-auto">
                <div className="p-3 sm:p-4 bg-muted/30">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {thread.sent_by?.name || "Admin"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold break-all">
                          {thread.sent_by?.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(thread.sent_at).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div
                        className="text-sm whitespace-pre-wrap mt-2 prose prose-sm max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: thread.body }}
                      />
                    </div>
                  </div>
                </div>

                {thread.replies.map((reply, i) => {
                  const isAdminReply = reply.sender_email?.includes(
                    "developer.vraj@gmail.com"
                  );
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-3 sm:p-4 border-t transition-colors",
                        isAdminReply ? "bg-blue-50" : "bg-green-50"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold",
                            isAdminReply
                              ? "bg-blue-100 text-blue-600"
                              : "bg-green-100 text-green-700"
                          )}
                        >
                          {isAdminReply ? "Admin" : "Cust"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-semibold break-all">
                              {reply.sender_email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.received_at).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                          <div
                            className="text-sm whitespace-pre-wrap mt-2 prose prose-sm max-w-none break-words"
                            dangerouslySetInnerHTML={{
                              __html: reply.reply_body,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Reply Button */}
                <div className="p-3 sm:p-4 border-t bg-muted/20">
                  <Button
                    onClick={() => handleReply(thread)}
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center"
                  >
                    <Reply className="w-4 h-4 mr-2" /> Reply to this thread
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {replyDialogOpen && (
        <ComposeReplyDialog
          open={replyDialogOpen}
          onOpenChange={setReplyDialogOpen}
          customer={customer}
          originalEmail={selectedEmail}
          onEmailSent={fetchCommunications}
        />
      )}
    </>
  );
};
