import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ProductsManager } from "@/components/settings/ProductsManager";

const Products = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("products")}</h1>
      </div>

      <CardContent>
        <ProductsManager />
      </CardContent>
    </div>
  );
};

export default Products;
