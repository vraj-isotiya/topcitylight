import { useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  Reply,
  ChevronDown,
  ChevronUp,
  User,
  UserCircle,
  Send,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmailListProps {
  emails: any[];

  onReply?: (thread: any) => void;
}

export const EmailList = memo(function EmailList({
  emails,
  onReply,
}: EmailListProps) {
  const { t } = useTranslation();
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  if (!emails || emails.length === 0) {
    return (
      <Card aria-live="polite">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            {t("noEmailsYet")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedEmail((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {emails.map((email) => {
        const hasReplies =
          Array.isArray(email.replies) && email.replies.length > 0;
        return (
          <Card
            key={email.id}
            className={cn(
              "transition-all duration-200 hover:shadow-md focus-within:shadow-md",
              expandedEmail === email.id && "shadow-md"
            )}
          >
            {/* Header */}
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleExpand(email.id)}
              aria-expanded={expandedEmail === email.id}
              role="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Mail
                    className={cn(
                      "w-5 h-5 mt-1 flex-shrink-0",
                      hasReplies ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {email.subject}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {t("to")}: {email.customer?.name} ({email.customer?.email}
                      )
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(email.sent_at).toLocaleString()}
                    </p>
                    {hasReplies && (
                      <p className="text-xs mt-1 text-primary font-medium">
                        {email.replies.length}{" "}
                        {email.replies.length === 1 ? t("reply") : t("replies")}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={
                    expandedEmail === email.id
                      ? "Collapse thread"
                      : "Expand thread"
                  }
                >
                  {expandedEmail === email.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {/* Body & Replies */}
            {expandedEmail === email.id && (
              <CardContent className="border-t pt-4 space-y-4">
                {/* Original email (from Admin/You) */}
                <div
                  className="p-4 rounded-lg border bg-primary/10 border-primary/20"
                  aria-label="Original email from you"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <User
                      className="w-4 h-4 text-primary mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        You
                        {email.sent_by?.email
                          ? ` (${email.sent_by.email})`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(email.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{email.body}</p>
                </div>

                {/* Replies */}
                {hasReplies && (
                  <div className="space-y-3">
                    {email.replies.map((reply: any) => {
                      const isFromYou =
                        reply.sender_email === email.sent_by?.email;
                      return (
                        <div
                          key={reply.id}
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            isFromYou
                              ? "bg-primary/10 border-primary/20 "
                              : "bg-secondary/40 border-muted "
                          )}
                          aria-label={
                            isFromYou ? "Reply from you" : "Reply from customer"
                          }
                        >
                          <div
                            className={cn(
                              "flex items-start gap-2 mb-1",
                              // keep text flow logical; no reverse to preserve DOM reading order
                              isFromYou ? "" : ""
                            )}
                          >
                            {isFromYou ? (
                              <User
                                className="w-4 h-4 text-primary mt-0.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <UserCircle
                                className="w-4 h-4 text-primary mt-0.5"
                                aria-hidden="true"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {isFromYou
                                  ? "You"
                                  : email.customer?.name || "Customer"}
                                {reply.sender_email
                                  ? ` (${reply.sender_email})`
                                  : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(reply.received_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap mt-1">
                            {reply.reply_body}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
});
