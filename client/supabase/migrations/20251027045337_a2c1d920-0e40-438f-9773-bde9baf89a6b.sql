-- Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create customer_sources table
CREATE TABLE IF NOT EXISTS public.customer_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active sources" ON public.customer_sources;
CREATE POLICY "Anyone can view active sources"
  ON public.customer_sources FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage sources" ON public.customer_sources;
CREATE POLICY "Admins can manage sources"
  ON public.customer_sources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create business_types table
CREATE TABLE IF NOT EXISTS public.business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active business types" ON public.business_types;
CREATE POLICY "Anyone can view active business types"
  ON public.business_types FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage business types" ON public.business_types;
CREATE POLICY "Admins can manage business types"
  ON public.business_types FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create junction table for customer-product many-to-many relationship
CREATE TABLE IF NOT EXISTS public.customer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

ALTER TABLE public.customer_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view customer products" ON public.customer_products;
CREATE POLICY "Users can view customer products"
  ON public.customer_products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage customer products" ON public.customer_products;
CREATE POLICY "Users can manage customer products"
  ON public.customer_products FOR ALL
  USING (true);

-- Update customers table to use foreign keys instead of text fields
ALTER TABLE public.customers 
  DROP COLUMN IF EXISTS product,
  DROP COLUMN IF EXISTS customer_source,
  DROP COLUMN IF EXISTS business_type;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_source_id UUID REFERENCES public.customer_sources(id),
  ADD COLUMN IF NOT EXISTS business_type_id UUID REFERENCES public.business_types(id);

-- Create CRM settings table for admin customization
CREATE TABLE IF NOT EXISTS public.crm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_name TEXT DEFAULT 'TopCity Light CRM',
  crm_logo_url TEXT,
  primary_color TEXT DEFAULT '#334155',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view CRM settings" ON public.crm_settings;
CREATE POLICY "Anyone can view CRM settings"
  ON public.crm_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update CRM settings" ON public.crm_settings;
CREATE POLICY "Admins can update CRM settings"
  ON public.crm_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default CRM settings if not exists
INSERT INTO public.crm_settings (crm_name, primary_color)
SELECT 'TopCity Light CRM', '#334155'
WHERE NOT EXISTS (SELECT 1 FROM public.crm_settings);

-- Add trigger for products updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default data
INSERT INTO public.products (name, description) VALUES
  ('LED Lighting Solutions', 'Commercial LED lighting products'),
  ('Street Lighting', 'Municipal street lighting systems'),
  ('Industrial Lighting', 'Heavy-duty industrial lighting'),
  ('Smart Lighting', 'IoT-enabled smart lighting solutions')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.customer_sources (name) VALUES
  ('Website'),
  ('Referral'),
  ('Trade Show'),
  ('Cold Call'),
  ('Social Media'),
  ('Partner')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.business_types (name) VALUES
  ('Manufacturer'),
  ('Distributor'),
  ('Retailer'),
  ('Contractor'),
  ('Government'),
  ('Corporate')
ON CONFLICT (name) DO NOTHING;