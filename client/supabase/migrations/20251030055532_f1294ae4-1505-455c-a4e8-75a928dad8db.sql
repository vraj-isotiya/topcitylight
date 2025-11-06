-- Fix infinite recursion in user_roles RLS policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create policies that avoid recursion
-- Allow initial setup when no admin exists
CREATE POLICY "Allow initial admin setup"
ON public.user_roles
FOR ALL
USING (
  NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role
  )
);

-- Allow admins to manage all roles (using security definer function)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Fix email_provider_settings policies to allow INSERT
DROP POLICY IF EXISTS "Admins can manage email providers" ON public.email_provider_settings;

CREATE POLICY "Admins can manage email providers"
ON public.email_provider_settings
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add secondary_color, font_family, and font_size to crm_settings
ALTER TABLE public.crm_settings 
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT '16px';