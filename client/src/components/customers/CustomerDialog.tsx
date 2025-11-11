import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { customerSchema } from "@/lib/validations/customer";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import axiosClient from "@/lib/axiosClient";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
  onSave: (data: any) => void;
}

export const CustomerDialog = ({
  open,
  onOpenChange,
  customer,
  onSave,
}: CustomerDialogProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    country: "",
    province: "",
    city: "",
    postal_code: "",
    fax: "",
    bank_name: "",
    bank_account: "",
    customer_source_id: "",
    business_type_id: "",
    website: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_phone: "",
    notes: "",
    status: "Lead",
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (customer) {
      const matchedSource = sources.find(
        (s) =>
          s.name.toLowerCase() === customer.customer_source_name?.toLowerCase()
      );

      const matchedBusinessType = businessTypes.find(
        (b) =>
          b.name.toLowerCase() === customer.business_type_name?.toLowerCase()
      );
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        company: customer.company || "",
        address: customer.address || "",
        country: customer.country || "",
        province: customer.province || "",
        city: customer.city || "",
        postal_code: customer.postal_code || "",
        fax: customer.fax || "",
        bank_name: customer.bank_name || "",
        bank_account: customer.bank_account || "",
        customer_source_id: matchedSource?.id || "",
        business_type_id: matchedBusinessType?.id || "",
        website: customer.website || "",
        contact_person_name: customer.contact_person_name || "",
        contact_person_email: customer.contact_person_email || "",
        contact_person_phone: customer.contact_person_phone || "",
        notes: customer.notes || "",
        status: customer.status || "Lead",
      });
      fetchCustomerProducts(customer.id);
    } else {
      setSelectedProducts([]);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        country: "",
        province: "",
        city: "",
        postal_code: "",
        fax: "",
        bank_name: "",
        bank_account: "",
        customer_source_id: "",
        business_type_id: "",
        website: "",
        contact_person_name: "",
        contact_person_email: "",
        contact_person_phone: "",
        notes: "",
        status: "Lead",
      });
    }
  }, [customer]);

  const fetchDropdownData = async () => {
    try {
      const [productsRes, sourcesRes, typesRes] = await Promise.all([
        axiosClient.get("/products/all"),
        axiosClient.get("/customer-sources/all"),
        axiosClient.get("/business-types/all"),
      ]);

      if (productsRes.data?.success)
        setProducts(
          productsRes.data.data.products.filter((p: any) => p.is_active)
        );
      if (sourcesRes.data?.success)
        setSources(
          sourcesRes.data.data.customer_sources.filter((s: any) => s.is_active)
        );
      if (typesRes.data?.success)
        setBusinessTypes(
          typesRes.data.data.business_types.filter((t: any) => t.is_active)
        );
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      toast({
        title: "Error",
        description: "Failed to load dropdown data.",
        variant: "destructive",
      });
    }
  };

  const fetchCustomerProducts = async (customerId: string) => {
    try {
      const res = await axiosClient.get(`/customer-products/${customerId}`);
      if (res.data?.success && Array.isArray(res.data.data.products)) {
        setSelectedProducts(
          res.data.data.products.map((p: any) => p.product_id)
        );
      }
    } catch (error) {
      console.error("Error fetching customer products:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    // Validate form data
    try {
      customerSchema.parse(formData);
    } catch (error: any) {
      const validationErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        if (err.path) {
          validationErrors[err.path[0]] = err.message;
        }
      });
      setErrors(validationErrors);
      toast({
        title: "Form Validation Failed",
        description:
          "Some required fields are missing or contain invalid data. Please review the highlighted fields and try again.",
        variant: "destructive",
      });

      return;
    }

    onSave({ ...formData, selectedProducts });
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const getSelectedActiveProducts = () => {
    // Return only active selected products
    return products.filter((p) => selectedProducts.includes(p.id));
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {customer ? t("editCustomer") : t("addNewCustomer")}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content */}
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-2 sm:pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BASIC INFO */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">
                  Company <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.company}</p>
                )}
              </div>

              {/* ADDRESS INFO */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.country}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">
                  Province <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={(e) => handleChange("province", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.province}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">
                  Postal Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.postal_code}
                  </p>
                )}
              </div>

              {/* BANK INFO */}
              <div className="space-y-2">
                <Label htmlFor="fax">Fax</Label>
                <Input
                  id="fax"
                  value={formData.fax}
                  onChange={(e) => handleChange("fax", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">
                  Bank Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => handleChange("bank_name", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.bank_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account">
                  Bank Account <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account}
                  onChange={(e) => handleChange("bank_account", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.bank_account}
                  </p>
                )}
              </div>

              {/* PRODUCTS MULTISELECT */}
              <div className="md:col-span-2 space-y-2">
                <Label>
                  Products <span className="text-destructive">*</span>
                </Label>
                <Popover
                  open={productSearchOpen}
                  onOpenChange={setProductSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productSearchOpen}
                      className="w-full justify-start text-left font-normal"
                    >
                      <span className="flex-1 truncate">
                        {getSelectedActiveProducts().length > 0
                          ? `${
                              getSelectedActiveProducts().length
                            } product(s) selected`
                          : "Search and select products..."}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search products..." />
                      <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {products.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => toggleProduct(product.id)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedProducts.includes(product.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <div className="flex-1">
                                <div>{product.name}</div>
                                {product.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* CUSTOMER SOURCE */}
              <div className="space-y-2">
                <Label htmlFor="customer_source_id">
                  {t("customerSource")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.customer_source_id}
                  onValueChange={(value) =>
                    handleChange("customer_source_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectSource")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customer_source_id && (
                  <p className="text-sm text-destructive">
                    {errors.customer_source_id}
                  </p>
                )}
              </div>

              {/* BUSINESS TYPE */}
              <div className="space-y-2">
                <Label htmlFor="business_type_id">
                  {t("businessType")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.business_type_id}
                  onValueChange={(value) =>
                    handleChange("business_type_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectBusinessType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.business_type_id && (
                  <p className="text-sm text-destructive">
                    {errors.business_type_id}
                  </p>
                )}
              </div>

              {/* CONTACT INFO */}
              <div className="space-y-2">
                <Label htmlFor="website">
                  {t("website")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://example.com"
                  className={errors.website ? "border-destructive" : ""}
                />
                {errors.website && (
                  <p className="text-sm text-destructive">{errors.website}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_name">
                  {t("contactPersonName")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={(e) =>
                    handleChange("contact_person_name", e.target.value)
                  }
                />
                {errors.contact_person_email && (
                  <p className="text-sm text-destructive">
                    {errors.contact_person_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_email">
                  {t("contactPersonEmail")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact_person_email"
                  type="email"
                  value={formData.contact_person_email}
                  onChange={(e) =>
                    handleChange("contact_person_email", e.target.value)
                  }
                  className={
                    errors.contact_person_email ? "border-destructive" : ""
                  }
                />
                {errors.contact_person_email && (
                  <p className="text-sm text-destructive">
                    {errors.contact_person_email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_phone">
                  {t("contactPersonPhone")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={(e) =>
                    handleChange("contact_person_phone", e.target.value)
                  }
                  className={
                    errors.contact_person_phone ? "border-destructive" : ""
                  }
                />
                {errors.contact_person_phone && (
                  <p className="text-sm text-destructive">
                    {errors.contact_person_phone}
                  </p>
                )}
              </div>

              {/* STATUS */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status}</p>
                )}
              </div>

              {/* NOTES */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Save Customer
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
