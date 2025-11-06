import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RoutePermission {
  id: string;
  route: string;
  allowed_roles: ("admin" | "user")[];
}

export const RoutePermissionsManager = () => {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<RoutePermission[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("route_permissions")
      .select("*")
      .order("route");

    if (error) {
      toast.error("Failed to load route permissions");
      console.error(error);
    } else if (data) {
      setRoutes(data);
    }
    setLoading(false);
  };

  const toggleRole = async (routeId: string, role: "admin" | "user") => {
    setSaving(routeId);
    
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    const currentRoles = route.allowed_roles;
    const newRoles: ("admin" | "user")[] = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    const { error } = await supabase
      .from("route_permissions")
      .update({ allowed_roles: newRoles })
      .eq("id", routeId);

    if (error) {
      toast.error("Failed to update permissions");
      console.error(error);
    } else {
      toast.success("Permissions updated");
      fetchRoutes();
    }
    
    setSaving(null);
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
        <CardTitle>Route Permissions</CardTitle>
        <CardDescription>
          Manage which roles can access specific routes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {routes.map((route) => (
          <div key={route.id} className="p-4 border rounded-lg space-y-3">
            <h3 className="font-semibold">{route.route}</h3>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${route.id}-admin`}
                  checked={route.allowed_roles.includes("admin")}
                  onCheckedChange={() => toggleRole(route.id, "admin")}
                  disabled={saving === route.id}
                />
                <Label htmlFor={`${route.id}-admin`}>Admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${route.id}-user`}
                  checked={route.allowed_roles.includes("user")}
                  onCheckedChange={() => toggleRole(route.id, "user")}
                  disabled={saving === route.id}
                />
                <Label htmlFor={`${route.id}-user`}>User</Label>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
