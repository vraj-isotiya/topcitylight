import { useState } from "react";
import { CRMSettingsForm } from "@/components/settings/CRMSettingsForm";
import { UserRolesManager } from "@/components/settings/UserRolesManager";
import { CustomerSourcesManager } from "@/components/settings/CustomerSourcesManager";
import { BusinessTypesManager } from "@/components/settings/BusinessTypesManager";
import { EmailProviderSettings } from "@/components/settings/EmailProviderSettings";
import { RoutePermissionsManager } from "@/components/settings/RoutePermissionsManager";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  Users,
  Package,
  Target,
  Building2,
  Mail,
  Shield,
  Key,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const Settings = () => {
  const { t } = useTranslation();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("settings")}</h1>
        <Button onClick={() => setIsPasswordDialogOpen(true)} variant="outline">
          <Key className="w-4 h-4 mr-2" />
          {t("changePassword")}
        </Button>
      </div>

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="crm" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">CRM</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">{t("emailProvider")}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t("users")}</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{t("sources")}</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("businessTypes")}</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t("permissions")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-6">
          <CRMSettingsForm />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <EmailProviderSettings />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserRolesManager />
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <CustomerSourcesManager />
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <BusinessTypesManager />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <RoutePermissionsManager />
        </TabsContent>
      </Tabs>

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </div>
  );
};

export default Settings;
