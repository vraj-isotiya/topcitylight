import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface EmailListProps {
  emails: any[];
}

export const EmailList = ({ emails }: EmailListProps) => {
  const { t } = useTranslation();

  if (emails.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            {t("noEmailsYet")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <Card key={email.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 mt-1 text-primary" />
              <div className="flex-1">
                <CardTitle className="text-base">{email.subject}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("to")}: {email.customer?.name} ({email.customer?.email})
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(email.sent_at).toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{email.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
