-- Fix search path for update_email_provider_updated_at function by recreating it
DROP TRIGGER IF EXISTS update_email_provider_settings_updated_at ON public.email_provider_settings;
DROP FUNCTION IF EXISTS update_email_provider_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_email_provider_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_email_provider_settings_updated_at
  BEFORE UPDATE ON public.email_provider_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_provider_updated_at();