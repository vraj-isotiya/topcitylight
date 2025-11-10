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
    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6 w-full max-w-[1500px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
          {t("settings")}
        </h1>
        <div className="flex justify-center sm:justify-end">
          <Button
            onClick={() => setIsPasswordDialogOpen(true)}
            variant="outline"
            className="w-full sm:w-auto justify-center"
          >
            <Key className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">{t("changePassword")}</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="crm" className="w-full">
        <div className="flex  w-full">
          <TabsList
            className="
            flex flex-wrap 
            w-full 
            gap-1
            items-start
            border-b border-border
            pb-1
            h-auto
            justify-start sm:justify-stretch"
          >
            <TabsTrigger
              value="crm"
              className="justify-center min-w-[100px] sm:flex-1 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <SettingsIcon className="h-4 w-4 flex-shrink-0" />
              <span>CRM</span>
            </TabsTrigger>

            <TabsTrigger
              value="email"
              className="justify-center min-w-[100px] sm:flex-1 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span>{t("emailProvider")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="users"
              className="justify-center min-w-[100px] sm:flex-1 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>{t("users")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="sources"
              className="justify-center min-w-[100px] sm:flex-1 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <Target className="h-4 w-4 flex-shrink-0" />
              <span>{t("sources")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="business"
              className="justify-center min-w-[100px] sm:flex-1 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span>{t("businessTypes")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="permissions"
              className="justify-center min-w-[100px] sm:flex-1 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>{t("permissions")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4 sm:mt-6">
          <TabsContent value="crm">
            <CRMSettingsForm />
          </TabsContent>

          <TabsContent value="email">
            <EmailProviderSettings />
          </TabsContent>

          <TabsContent value="users">
            <UserRolesManager />
          </TabsContent>

          <TabsContent value="sources">
            <CustomerSourcesManager />
          </TabsContent>

          <TabsContent value="business">
            <BusinessTypesManager />
          </TabsContent>

          <TabsContent value="permissions">
            <RoutePermissionsManager />
          </TabsContent>
        </div>
      </Tabs>

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </div>
  );
};

export default Settings;
