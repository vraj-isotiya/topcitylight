import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  customerId: string;
  emailId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, customerId, emailId }: SendEmailRequest = await req.json();

    if (!to || !subject || !body) {
      throw new Error("Missing required fields: to, subject, body");
    }

    console.log("Sending email to:", to);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch email provider settings
    const { data: providerSettings, error: settingsError } = await supabase
      .from("email_provider_settings")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (settingsError) {
      throw new Error("Failed to fetch email provider settings");
    }

    if (!providerSettings) {
      throw new Error("No active email provider configured. Please configure email settings in admin panel.");
    }

    let emailResponse;

    // Send email based on provider type
    switch (providerSettings.provider_type) {
      case "sendgrid":
        emailResponse = await sendViaSendGrid(providerSettings, to, subject, body);
        break;
      
      case "mailchimp":
        emailResponse = await sendViaMailchimp(providerSettings, to, subject, body);
        break;
      
      case "gmail":
      case "private":
        emailResponse = await sendViaSMTP(providerSettings, to, subject, body);
        break;
      
      default:
        throw new Error(`Unsupported email provider: ${providerSettings.provider_type}`);
    }

    console.log("Email sent successfully:", emailResponse);

    // If this is a reply, create a reply record
    if (emailId) {
      await supabase.from("email_replies").insert({
        email_id: emailId,
        customer_id: customerId,
        reply_body: body,
        subject: subject,
        from_address: providerSettings.from_email,
        received_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, response: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendViaSendGrid(settings: any, to: string, subject: string, body: string) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
      }],
      from: {
        email: settings.from_email,
        name: settings.from_name || settings.from_email,
      },
      subject: subject,
      content: [{
        type: "text/html",
        value: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</div>`,
      }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${errorText}`);
  }

  return { messageId: response.headers.get("x-message-id") };
}

async function sendViaMailchimp(settings: any, to: string, subject: string, body: string) {
  const response = await fetch("https://mandrillapp.com/api/1.0/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: settings.api_key,
      message: {
        html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</div>`,
        subject: subject,
        from_email: settings.from_email,
        from_name: settings.from_name || settings.from_email,
        to: [{
          email: to,
          type: "to",
        }],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailchimp API error: ${errorText}`);
  }

  const result = await response.json();
  return { messageId: result[0]?._id };
}

async function sendViaSMTP(settings: any, to: string, subject: string, body: string) {
  try {
    const cleanPassword = settings.smtp_password.replace(/\s+/g, '');
    
    const client = new SMTPClient({
      connection: {
        hostname: settings.smtp_host,
        port: settings.smtp_port,
        tls: true,
        auth: {
          username: settings.smtp_username,
          password: cleanPassword,
        },
      },
    });

    const htmlBody = body.includes('<') 
      ? body 
      : `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</div>`;

    await client.send({
      from: settings.from_name 
        ? `${settings.from_name} <${settings.from_email}>`
        : settings.from_email,
      to: to,
      subject: subject,
      content: htmlBody,
    });

    await client.close();

    return { messageId: `${Date.now()}@${settings.smtp_host}`, success: true };
  } catch (error: any) {
    console.error("SMTP Error:", error);
    throw new Error(`SMTP sending failed: ${error.message}. Please verify your email settings.`);
  }
}

serve(handler);
