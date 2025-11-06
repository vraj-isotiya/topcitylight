import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type ProviderType = "gmail" | "sendgrid" | "mailchimp" | "private";

interface EmailSettings {
  id?: string;
  provider_type: ProviderType;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  api_key: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
}

const providerDefaults = {
  gmail: {
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    imap_host: "imap.gmail.com",
    imap_port: 993,
  },
  sendgrid: {
    smtp_host: "smtp.sendgrid.net",
    smtp_port: 587,
  },
  mailchimp: {
    smtp_host: "smtp.mandrillapp.com",
    smtp_port: 587,
  },
  private: {
    smtp_host: "",
    smtp_port: 587,
    imap_host: "",
    imap_port: 993,
  },
};

export const EmailProviderSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings>({
    provider_type: "gmail",
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    imap_host: "",
    imap_port: 993,
    imap_username: "",
    imap_password: "",
    api_key: "",
    from_email: "",
    from_name: "",
    is_active: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_provider_settings")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching email settings:", error);
    } else if (data) {
      setSettings({
        ...data,
        provider_type: data.provider_type as ProviderType,
        smtp_password: "", // Don't show password
        imap_password: "", // Don't show password
        api_key: "", // Don't show API key
      });
    }
    setLoading(false);
  };

  const handleProviderChange = (provider: ProviderType) => {
    const defaults = providerDefaults[provider];
    setSettings((prev) => ({
      ...prev,
      provider_type: provider,
      ...defaults,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    if (!settings.from_email) {
      toast({
        title: "Error",
        description: "From email is required",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare the data - only include password/api_key if they're filled
      const dataToSave: any = {
        provider_type: settings.provider_type,
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_username: settings.smtp_username,
        from_email: settings.from_email,
        from_name: settings.from_name,
        is_active: settings.is_active,
        updated_by: user?.id,
      };

      // Only include passwords/keys if they're not empty (user changed them)
      if (settings.smtp_password) {
        dataToSave.smtp_password = settings.smtp_password;
      }
      if (settings.imap_password) {
        dataToSave.imap_password = settings.imap_password;
      }
      if (settings.api_key) {
        dataToSave.api_key = settings.api_key;
      }

      // Include IMAP settings for providers that support it
      if (settings.provider_type === "gmail" || settings.provider_type === "private") {
        dataToSave.imap_host = settings.imap_host;
        dataToSave.imap_port = settings.imap_port;
        dataToSave.imap_username = settings.imap_username;
      }

      let error;
      if (settings.id) {
        // Update existing
        ({ error } = await supabase
          .from("email_provider_settings")
          .update(dataToSave)
          .eq("id", settings.id));
      } else {
        // Insert new
        ({ error } = await supabase
          .from("email_provider_settings")
          .insert(dataToSave));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email provider settings saved successfully",
      });

      fetchSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const showSMTPFields = settings.provider_type !== "sendgrid" && settings.provider_type !== "mailchimp";
  const showIMAPFields = settings.provider_type === "gmail" || settings.provider_type === "private";
  const showAPIKey = settings.provider_type === "sendgrid" || settings.provider_type === "mailchimp";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Email Provider Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure your email provider for sending and receiving customer emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider_type">Email Provider</Label>
          <Select
            value={settings.provider_type}
            onValueChange={(value) => handleProviderChange(value as ProviderType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gmail">Gmail / Google Workspace</SelectItem>
              <SelectItem value="sendgrid">SendGrid</SelectItem>
              <SelectItem value="mailchimp">Mailchimp Transactional</SelectItem>
              <SelectItem value="private">Private SMTP Server</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from_email">From Email *</Label>
            <Input
              id="from_email"
              type="email"
              value={settings.from_email}
              onChange={(e) =>
                setSettings({ ...settings, from_email: e.target.value })
              }
              placeholder="no-reply@yourdomain.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_name">From Name</Label>
            <Input
              id="from_name"
              value={settings.from_name}
              onChange={(e) =>
                setSettings({ ...settings, from_name: e.target.value })
              }
              placeholder="Your Company Name"
            />
          </div>
        </div>

        {showAPIKey && (
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key *</Label>
            <Input
              id="api_key"
              type="password"
              value={settings.api_key}
              onChange={(e) =>
                setSettings({ ...settings, api_key: e.target.value })
              }
              placeholder="Enter your API key"
            />
            <p className="text-xs text-muted-foreground">
              {settings.provider_type === "sendgrid" && "Get your API key from SendGrid dashboard"}
              {settings.provider_type === "mailchimp" && "Get your API key from Mailchimp Transactional"}
            </p>
          </div>
        )}

        {showSMTPFields && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  value={settings.smtp_host}
                  onChange={(e) =>
                    setSettings({ ...settings, smtp_host: e.target.value })
                  }
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) =>
                    setSettings({ ...settings, smtp_port: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_username">SMTP Username</Label>
                <Input
                  id="smtp_username"
                  value={settings.smtp_username}
                  onChange={(e) =>
                    setSettings({ ...settings, smtp_username: e.target.value })
                  }
                  placeholder="username@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_password">SMTP Password</Label>
                <Input
                  id="smtp_password"
                  type="password"
                  value={settings.smtp_password}
                  onChange={(e) =>
                    setSettings({ ...settings, smtp_password: e.target.value })
                  }
                  placeholder={settings.id ? "Leave blank to keep current" : "Enter password"}
                />
              </div>
            </div>
          </>
        )}

        {showIMAPFields && (
          <>
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-4">IMAP Settings (for receiving emails)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="imap_host">IMAP Host</Label>
                  <Input
                    id="imap_host"
                    value={settings.imap_host}
                    onChange={(e) =>
                      setSettings({ ...settings, imap_host: e.target.value })
                    }
                    placeholder="imap.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap_port">IMAP Port</Label>
                  <Input
                    id="imap_port"
                    type="number"
                    value={settings.imap_port}
                    onChange={(e) =>
                      setSettings({ ...settings, imap_port: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="imap_username">IMAP Username</Label>
                  <Input
                    id="imap_username"
                    value={settings.imap_username}
                    onChange={(e) =>
                      setSettings({ ...settings, imap_username: e.target.value })
                    }
                    placeholder="username@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap_password">IMAP Password</Label>
                  <Input
                    id="imap_password"
                    type="password"
                    value={settings.imap_password}
                    onChange={(e) =>
                      setSettings({ ...settings, imap_password: e.target.value })
                    }
                    placeholder={settings.id ? "Leave blank to keep current" : "Enter password"}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center space-x-2 pt-4">
          <Switch
            id="is_active"
            checked={settings.is_active}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, is_active: checked })
            }
          />
          <Label htmlFor="is_active">Active</Label>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Email Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
