import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserPermission {
  id: string;
  user_id: string;
  resource: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

export const UserPermissionsManager = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [newPermission, setNewPermission] = useState({
    user_id: "",
    resource: "",
    can_view: true,
    can_edit: false,
    can_delete: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [permissionsRes, usersRes] = await Promise.all([
      supabase.from("user_permissions").select("*"),
      supabase.from("profiles").select("id, email, full_name"),
    ]);

    if (permissionsRes.error) {
      toast.error(t("failedToLoadPermissions"));
      console.error(permissionsRes.error);
    } else {
      setPermissions(permissionsRes.data || []);
    }

    if (usersRes.error) {
      console.error(usersRes.error);
    } else {
      setUsers(usersRes.data || []);
    }

    setLoading(false);
  };

  const addPermission = async () => {
    if (!newPermission.user_id || !newPermission.resource) {
      toast.error(t("fillAllFields"));
      return;
    }

    const { error } = await supabase
      .from("user_permissions")
      .insert([newPermission]);

    if (error) {
      toast.error(t("failedToUpdatePermissions"));
      console.error(error);
    } else {
      toast.success(t("permissionsUpdated"));
      setNewPermission({
        user_id: "",
        resource: "",
        can_view: true,
        can_edit: false,
        can_delete: false,
      });
      fetchData();
    }
  };

  const updatePermission = async (
    id: string,
    field: string,
    value: boolean
  ) => {
    const { error } = await supabase
      .from("user_permissions")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      toast.error(t("failedToUpdatePermissions"));
      console.error(error);
    } else {
      toast.success(t("permissionsUpdated"));
      fetchData();
    }
  };

  const deletePermission = async (id: string) => {
    const { error } = await supabase
      .from("user_permissions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(t("failedToUpdatePermissions"));
      console.error(error);
    } else {
      toast.success(t("permissionsUpdated"));
      fetchData();
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
        <CardTitle>{t("userPermissionsManagement")}</CardTitle>
        <CardDescription>{t("manageUserPermissions")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <h3 className="font-semibold">{t("addPermission")}</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("selectCustomer")}</Label>
              <Select
                value={newPermission.user_id}
                onValueChange={(value) =>
                  setNewPermission({ ...newPermission, user_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCustomer")} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("resource")}</Label>
              <Select
                value={newPermission.resource}
                onValueChange={(value) =>
                  setNewPermission({ ...newPermission, resource: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectResource")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer">{t("customer")}</SelectItem>
                  <SelectItem value="Email">{t("email")}</SelectItem>
                  <SelectItem value="Product">{t("product")}</SelectItem>
                  <SelectItem value="Source">{t("source")}</SelectItem>
                  <SelectItem value="Business Type">
                    {t("businessType")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-view"
                checked={newPermission.can_view}
                onCheckedChange={(checked) =>
                  setNewPermission({ ...newPermission, can_view: !!checked })
                }
              />
              <Label htmlFor="new-view">{t("canView")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-edit"
                checked={newPermission.can_edit}
                onCheckedChange={(checked) =>
                  setNewPermission({ ...newPermission, can_edit: !!checked })
                }
              />
              <Label htmlFor="new-edit">{t("canEdit")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-delete"
                checked={newPermission.can_delete}
                onCheckedChange={(checked) =>
                  setNewPermission({ ...newPermission, can_delete: !!checked })
                }
              />
              <Label htmlFor="new-delete">{t("canDelete")}</Label>
            </div>
          </div>
          <Button onClick={addPermission}>
            <Plus className="w-4 h-4 mr-2" />
            {t("addPermission")}
          </Button>
        </div>

        <div className="space-y-4">
          {permissions.map((permission) => {
            const user = users.find((u) => u.id === permission.user_id);
            return (
              <div
                key={permission.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {user?.full_name || user?.email}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {permission.resource}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePermission(permission.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${permission.id}-view`}
                      checked={permission.can_view}
                      onCheckedChange={(checked) =>
                        updatePermission(permission.id, "can_view", !!checked)
                      }
                    />
                    <Label htmlFor={`${permission.id}-view`}>
                      {t("canView")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${permission.id}-edit`}
                      checked={permission.can_edit}
                      onCheckedChange={(checked) =>
                        updatePermission(permission.id, "can_edit", !!checked)
                      }
                    />
                    <Label htmlFor={`${permission.id}-edit`}>
                      {t("canEdit")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${permission.id}-delete`}
                      checked={permission.can_delete}
                      onCheckedChange={(checked) =>
                        updatePermission(permission.id, "can_delete", !!checked)
                      }
                    />
                    <Label htmlFor={`${permission.id}-delete`}>
                      {t("canDelete")}
                    </Label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
