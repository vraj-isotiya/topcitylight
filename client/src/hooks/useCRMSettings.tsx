import { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";

interface CRMSettings {
  crm_name: string;
  crm_logo_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  font_size: string;
}

export const useCRMSettings = () => {
  const [settings, setSettings] = useState<CRMSettings | null>(null);
  useEffect(() => {
    const fetchAndApplySettings = async () => {
      try {
        const { data } = await axiosClient.get("/crm-settings/");
        const crmsettings = data?.data;

        if (!crmsettings) return;
        setSettings(data?.data);
        const root = document.documentElement;

        //Apply font family
        if (crmsettings.font_family) {
          root.style.setProperty("--font-family", crmsettings.font_family);
          document.body.style.fontFamily = crmsettings.font_family;
        }

        // Apply font size
        if (crmsettings.font_size) {
          root.style.fontSize = crmsettings.font_size;
        }

        // Apply colors (convert to HSL for CSS variables)
        if (crmsettings.primary_color) {
          const primaryHSL = hexToHSL(crmsettings.primary_color);
          root.style.setProperty("--primary", primaryHSL);
        }

        if (crmsettings.secondary_color) {
          const secondaryHSL = hexToHSL(crmsettings.secondary_color);
          root.style.setProperty("--secondary", secondaryHSL);
        }
      } catch (error) {
        console.error("Failed to fetch CRM settings:", error);
      }
    };

    fetchAndApplySettings();

    // Optional: Listen for a custom event to re-apply settings after update
    const handleSettingsUpdated = () => fetchAndApplySettings();
    window.addEventListener("crmSettingsUpdated", handleSettingsUpdated);

    return () => {
      window.removeEventListener("crmSettingsUpdated", handleSettingsUpdated);
    };
  }, []);
  return settings;
};

// Helper: Convert HEX → HSL
function hexToHSL(hex: string): string {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);
  return `${h} ${s}% ${lightness}%`;
}
