import { useEffect, useState } from "react";
import { Mail, Reply, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ComposeReplyDialog } from "./ComposeReplyDialog";
import axiosClient from "@/lib/axiosClient";

interface CommunicationHistoryProps {
  customerId: string;
}

interface EmailThread {
  subject: string;
  body: string;
  sent_at: string;
  sent_by: {
    name: string;
    email: string;
  };
  customer: {
    name: string;
    email: string;
  };
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

  // Fetch customer info
  const fetchCustomer = async () => {
    try {
      const res = await axiosClient.get(`/customers/${customerId}`);
      if (res.data?.success) {
        setCustomer(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  // Fetch email threads for customer
  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/mail/thread/${customerId}`);

      if (res.data?.success && Array.isArray(res.data.data)) {
        console.log(res.data.data);
        const threadsData = res.data.data.map((thread: any) => ({
          id: thread.thread_id,
          subject: thread.subject,
          body: thread.body,
          sent_at: thread.sent_at,
          sent_by: thread.sent_by,
          customer: thread.customer,
          replies: (thread.replies || []).sort(
            (a: any, b: any) =>
              new Date(a.received_at).getTime() -
              new Date(b.received_at).getTime()
          ),
          expanded: false,
        }));

        setThreads(threadsData);
      } else {
        setThreads([]);
      }
    } catch (error) {
      console.error("Error fetching communications:", error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleThread = (subject: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.subject === subject
          ? { ...thread, expanded: !thread.expanded }
          : thread
      )
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

  if (loading) {
    return (
      <Card className="p-6 text-center text-muted-foreground text-sm">
        Loading communications...
      </Card>
    );
  }

  if (threads.length === 0) {
    return (
      <>
        <div className="flex justify-end mb-4">
          <Button onClick={handleNewEmail} size="sm">
            <Send className="w-4 h-4 mr-2" />
            New Email
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

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleNewEmail} size="sm">
          <Send className="w-4 h-4 mr-2" />
          New Email
        </Button>
      </div>
      <div className="space-y-3">
        {threads.map((thread, idx) => (
          <Card
            key={idx}
            className={cn(
              "transition-all duration-200 hover:shadow-md",
              thread.expanded && "shadow-md"
            )}
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleThread(thread.subject)}
            >
              <div className="flex items-start justify-between gap-4">
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
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-sm truncate">
                        {thread.subject}
                      </h5>
                      {thread.replies.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
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
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {thread.body}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  {thread.expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {thread.expanded && (
              <div className="border-t">
                {/* Original Email */}
                <div className="p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {thread.sent_by?.name || "You"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          {thread.sent_by?.email || "You"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(thread.sent_at).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mt-2">
                        {thread.body}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {thread.replies.map((reply, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-4",
                      i % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Reply className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">
                            {reply.sender_email || "Customer"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.received_at).toLocaleString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap mt-2">
                          {reply.reply_body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Reply Button */}
                <div className="p-4 border-t bg-muted/20">
                  <Button
                    onClick={() => handleReply(thread)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply to this thread
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <ComposeReplyDialog
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        customer={customer}
        originalEmail={selectedEmail}
        onEmailSent={fetchCommunications}
      />
    </>
  );
};
