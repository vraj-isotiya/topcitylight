import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosClient from "@/lib/axiosClient";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Poppins", label: "Poppins" },
  { value: "Nunito", label: "Nunito" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "Raleway", label: "Raleway" },
];

export const CRMSettingsForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: "",
    crm_name: "TopCity Light CRM",
    crm_logo_url: "",
    primary_color: "#334155",
    secondary_color: "#ffffff",
    font_family: "Inter",
    font_size: "16px",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/crm-settings/");
      if (res.data.success && res.data.data) {
        setSettings({
          ...res.data.data,
          crm_logo_url: res.data.data.crm_logo_url || "",
          secondary_color: res.data.data.secondary_color || "#ffffff",
          font_family: res.data.data.font_family || "Inter",
          font_size: res.data.data.font_size || "16px",
        });
      } else {
        toast({
          title: "Error",
          description: res.data.message || "Failed to fetch settings",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.id) {
      toast({
        title: "Error",
        description: "No CRM setting ID found to update.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await axiosClient.patch(`/crm-settings/${settings.id}`, {
        crm_name: settings.crm_name,
        crm_logo_url: settings.crm_logo_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        font_family: settings.font_family,
        font_size: settings.font_size,
      });

      if (res.data.success) {
        toast({
          title: "Success",
          description:
            "CRM settings updated successfully. Refresh to see changes.",
        });
        window.dispatchEvent(new Event("crmSettingsUpdated"));
      } else {
        toast({
          title: "Error",
          description: res.data.message || "Failed to update settings",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Error updating settings",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRM Customization</CardTitle>
        <CardDescription>
          Customize your CRM name, logo, and primary color
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="crm_name">CRM Name</Label>
          <Input
            id="crm_name"
            value={settings.crm_name}
            onChange={(e) =>
              setSettings({ ...settings, crm_name: e.target.value })
            }
            placeholder="Enter CRM name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crm_logo_url">Logo URL</Label>
          <Input
            id="crm_logo_url"
            value={settings.crm_logo_url}
            onChange={(e) =>
              setSettings({ ...settings, crm_logo_url: e.target.value })
            }
            placeholder="https://example.com/logo.png"
          />
          {settings.crm_logo_url && (
            <div className="mt-2">
              <img
                src={settings.crm_logo_url}
                alt="CRM Logo Preview"
                className="h-12 object-contain"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_color">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              id="primary_color"
              type="color"
              value={settings.primary_color}
              onChange={(e) =>
                setSettings({ ...settings, primary_color: e.target.value })
              }
              className="w-20 h-10"
            />
            <Input
              value={settings.primary_color}
              onChange={(e) =>
                setSettings({ ...settings, primary_color: e.target.value })
              }
              placeholder="#334155"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary_color">Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              id="secondary_color"
              type="color"
              value={settings.secondary_color}
              onChange={(e) =>
                setSettings({ ...settings, secondary_color: e.target.value })
              }
              className="w-20 h-10"
            />
            <Input
              value={settings.secondary_color}
              onChange={(e) =>
                setSettings({ ...settings, secondary_color: e.target.value })
              }
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="font_family">Font Family</Label>
            <Select
              value={settings.font_family}
              onValueChange={(value) =>
                setSettings({ ...settings, font_family: value })
              }
            >
              <SelectTrigger id="font_family">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {FONT_OPTIONS.map((font) => (
                  <SelectItem
                    key={font.value}
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="font_size">Font Size</Label>
            <Input
              id="font_size"
              value={settings.font_size}
              onChange={(e) =>
                setSettings({ ...settings, font_size: e.target.value })
              }
              placeholder="16px"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};
