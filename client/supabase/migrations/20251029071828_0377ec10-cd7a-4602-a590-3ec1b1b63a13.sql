-- Create email provider settings table
CREATE TABLE IF NOT EXISTS public.email_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL CHECK (provider_type IN ('gmail', 'sendgrid', 'mailchimp', 'private')),
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  api_key TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.email_provider_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email provider settings
CREATE POLICY "Admins can manage email providers"
ON public.email_provider_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update email_replies table to support better tracking
ALTER TABLE public.email_replies 
ADD COLUMN IF NOT EXISTS message_id TEXT,
ADD COLUMN IF NOT EXISTS from_address TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_replies_message_id ON public.email_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_customer_id ON public.emails(customer_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email provider settings
DROP TRIGGER IF EXISTS update_email_provider_settings_updated_at ON public.email_provider_settings;
CREATE TRIGGER update_email_provider_settings_updated_at
  BEFORE UPDATE ON public.email_provider_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_provider_updated_at();