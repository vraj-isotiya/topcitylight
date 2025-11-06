import { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const CustomerSourcesManager = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", is_active: true });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await axiosClient.get("/customer-sources/all");
      if (res.data.success && Array.isArray(res.data.data.customer_sources)) {
        setSources(res.data.data.customer_sources);
      } else {
        toast.error("Failed to fetch customer sources");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching customer sources");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Source name is required");
      return;
    }

    try {
      if (editingId) {
        const res = await axiosClient.patch(
          `/customer-sources/${editingId}`,
          formData
        );

        if (res.data.success) {
          toast.success("Source updated successfully");
        } else {
          toast.error(res.data.message || "Failed to update source");
        }
      } else {
        const res = await axiosClient.post("/customer-sources/add", formData);

        if (res.data.success) {
          toast.success("Source created successfully");
        } else {
          toast.error(res.data.message || "Failed to create source");
        }
      }

      setFormData({ name: "", is_active: true });
      setEditingId(null);
      fetchSources();
    } catch (err) {
      console.error(err);
      toast.error("Error saving source");
    }
  };

  const handleEdit = async (source: any) => {
    try {
      const res = await axiosClient.get(`/customer-sources/${source.id}`);
      if (res.data.success && res.data.data) {
        setEditingId(source.id);
        setFormData({
          name: res.data.data.name,
          is_active: res.data.data.is_active,
        });
      } else {
        toast.error("Failed to fetch customer source details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching customer source");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosClient.delete(`/customer-sources/${id}`);
      if (res.data.success) {
        toast.success("Source deleted successfully");
        fetchSources();
      } else {
        toast.error(res.data.message || "Failed to delete source");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting source");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", is_active: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Sources Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="source-name">Source Name *</Label>
            <Input
              id="source-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter source name (e.g., Website, Referral)"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="source-active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="source-active">Active</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Add"} Source
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Existing Sources</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{source.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {source.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(source)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(source.id)}
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
