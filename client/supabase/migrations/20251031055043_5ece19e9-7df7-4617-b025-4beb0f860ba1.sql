-- Drop all problematic policies on user_roles
DROP POLICY IF EXISTS "Allow initial admin setup" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create simple, non-recursive policies for user_roles
-- Service role can do everything (used by edge functions and triggers)
CREATE POLICY "Service role full access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can view their own roles
CREATE POLICY "Users view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all roles using the security definer function
CREATE POLICY "Admins manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix profiles table to allow admin to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users view own or admin views all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create route permissions table
CREATE TABLE IF NOT EXISTS public.route_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL UNIQUE,
  allowed_roles app_role[] NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.route_permissions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view route permissions
CREATE POLICY "Users can view route permissions"
ON public.route_permissions
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage route permissions
CREATE POLICY "Admins manage route permissions"
ON public.route_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default route permissions
INSERT INTO public.route_permissions (route, allowed_roles)
VALUES 
  ('/', ARRAY['admin'::app_role, 'user'::app_role]),
  ('/dashboard', ARRAY['admin'::app_role, 'user'::app_role]),
  ('/customers', ARRAY['admin'::app_role, 'user'::app_role]),
  ('/emails', ARRAY['admin'::app_role, 'user'::app_role]),
  ('/reports', ARRAY['admin'::app_role, 'user'::app_role]),
  ('/settings', ARRAY['admin'::app_role])
ON CONFLICT (route) DO NOTHING;