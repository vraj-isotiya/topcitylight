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
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl font-semibold text-center sm:text-left">
          Products Management
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product Form */}
        <div className="space-y-4 p-4 sm:p-6 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="product-name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 sm:col-span-2">
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
          </div>

          {/* Active Switch */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-2">
            <Switch
              id="product-active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="product-active">Active</Label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto justify-center"
            >
              {editingId ? "Update" : "Add"} Product
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base sm:text-lg">
            Existing Products
          </h3>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No products found.
              </p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg bg-card"
                >
                  {/* Product Info */}
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base break-words">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground break-words">
                        {product.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Status: {product.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end sm:justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                      className="w-8 h-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      className="w-8 h-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
