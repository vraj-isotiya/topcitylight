-- Allow users to create roles if they are admin OR if no admins exist yet (bootstrap scenario)
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Allow role creation if no admin exists yet (bootstrap)
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role)
);

-- Also update the profiles RLS to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);