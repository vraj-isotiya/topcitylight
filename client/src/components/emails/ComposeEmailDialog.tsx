import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: any[];
  onEmailSent: () => void;
}

export const ComposeEmailDialog = ({ open, onOpenChange, customers, onEmailSent }: ComposeEmailDialogProps) => {
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const customer = customers.find(c => c.id === customerId);

      if (!customer?.email) {
        throw new Error("Customer email is required");
      }

      // Insert email record
      const { data: newEmail, error: insertError } = await supabase
        .from("emails")
        .insert([
          {
            customer_id: customerId,
            subject,
            body,
            sent_by: user?.id,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Send via edge function
      const { error: sendError } = await supabase.functions.invoke("send-email-enhanced", {
        body: {
          to: customer.email,
          subject,
          body,
          customerId,
          emailId: newEmail.id,
        },
      }).catch(async () => {
        // Fallback to original send-email function
        return await supabase.functions.invoke("send-email", {
          body: {
            to: customer.email,
            subject,
            body,
            customerId,
            emailId: newEmail.id,
          },
        });
      });

      if (sendError) throw sendError;

      toast({
        title: "Success",
        description: "Email sent successfully",
      });

      onEmailSent();
      onOpenChange(false);
      setCustomerId("");
      setSubject("");
      setBody("");
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
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
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">To</Label>
            <Select value={customerId} onValueChange={setCustomerId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
