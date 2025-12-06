import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import axiosClient from "@/lib/axiosClient";

interface ComposeReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
  originalEmail?: any;
  onEmailSent: () => void;
}

export const ComposeReplyDialog = ({
  open,
  onOpenChange,
  customer,
  originalEmail,
  onEmailSent,
}: ComposeReplyDialogProps) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (originalEmail) {
      setSubject(`Re: ${originalEmail.subject}`);
    } else {
      setSubject("");
    }
  }, [originalEmail]);
  console.log(subject);
  const handleSend = async () => {
    if (!customer?.email) {
      toast({
        title: "Error",
        description: "Customer email is required",
        variant: "destructive",
      });
      return;
    }

    if (!subject || !body) {
      toast({
        title: "Error",
        description: "Subject and message are required",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const userRes = await axiosClient.get("/users/current-user");
      const user = userRes.data?.data?.user;
      if (!user?.id) throw new Error("User not authenticated");

      let response;
      console.log(originalEmail);
      //  If replying to a thread → /mail/reply
      if (originalEmail) {
        response = await axiosClient.post("/mail/reply", {
          thread_id: originalEmail.id, // The thread being replied to
          reply_body: body,
        });
      } else {
        //  If sending a new email → /mail/send
        response = await axiosClient.post("/mail/send", {
          user_id: user.id,
          customer_id: customer.id,
          subject,
          body,
        });
      }

      if (response.data?.success) {
        toast({
          title: "Success",
          description: originalEmail
            ? "Reply sent successfully."
            : "Email sent successfully.",
        });
        setSubject("");
        setBody("");
        onOpenChange(false);
        onEmailSent();
      } else {
        throw new Error(response.data?.message || "Failed to send email.");
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {originalEmail ? "Reply to Email" : "Compose Email"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!originalEmail && (
            <>
              <div>
                <Label>To</Label>
                <Input
                  value={customer?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
            </>
          )}
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              disabled={!!originalEmail}
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={10}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {originalEmail ? "Send Reply" : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
