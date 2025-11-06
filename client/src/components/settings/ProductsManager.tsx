import { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const ProductsManager = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const api = axiosClient;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/all");
      if (res.data.success && Array.isArray(res.data.data.products)) {
        setProducts(res.data.data.products);
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      toast.error("Error fetching products");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    try {
      if (editingId) {
        // PATCH update product by ID
        const res = await api.patch(`/products/${editingId}`, formData);
        if (res.data.success) {
          toast.success("Product updated");
        } else {
          toast.error(res.data.message || "Failed to update product");
        }
      } else {
        // POST new product
        const res = await api.post("/products/add", formData);
        if (res.data.success) {
          toast.success("Product created");
        } else {
          toast.error(res.data.message || "Failed to create product");
        }
      }

      // reset form and reload
      setFormData({ name: "", description: "", is_active: true });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product");
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || "",
      is_active: product.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error(res.data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting product");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", is_active: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter product name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter product description"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="product-active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="product-active">Active</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Add"} Product
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Existing Products</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  {product.description && (
                    <p className="text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Status: {product.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
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
