import { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const BusinessTypesManager = () => {
  const [types, setTypes] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", is_active: true });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await axiosClient.get("/business-types/all");
      if (res.data.success) {
        setTypes(res.data.data.business_types || []);
      } else {
        toast.error(res.data.message || "Failed to fetch business types");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Error fetching business types"
      );
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Business type name is required");
      return;
    }

    try {
      if (editingId) {
        const res = await axiosClient.patch(
          `/business-types/${editingId}`,
          formData
        );
        if (res.data.success) {
          toast.success("Business type updated successfully");
        } else {
          toast.error(res.data.message || "Failed to update");
        }
      } else {
        const res = await axiosClient.post("/business-types/add", formData);
        if (res.data.success) {
          toast.success("Business type created successfully");
        } else {
          toast.error(res.data.message || "Failed to create");
        }
      }

      setFormData({ name: "", is_active: true });
      setEditingId(null);
      fetchTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error saving business type");
    }
  };

  const handleEdit = (type: any) => {
    setEditingId(type.id);
    setFormData({ name: type.name, is_active: type.is_active });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosClient.delete(`/business-types/${id}`);
      if (res.data.success) {
        toast.success("Business type deleted successfully");
        fetchTypes();
      } else {
        toast.error(res.data.message || "Failed to delete");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Error deleting business type"
      );
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", is_active: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Types Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="type-name">Business Type Name *</Label>
            <Input
              id="type-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter business type (e.g., Retail, Wholesale)"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="type-active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="type-active">Active</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Add"} Business Type
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Existing Business Types</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {types.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No business types found.
              </p>
            )}
            {types.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{type.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {type.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(type)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(type.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
