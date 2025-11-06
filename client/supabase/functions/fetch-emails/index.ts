import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting email fetch process...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active email provider settings
    const { data: providerSettings, error: settingsError } = await supabase
      .from("email_provider_settings")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (settingsError || !providerSettings) {
      console.log("No active email provider configured");
      return new Response(
        JSON.stringify({ message: "No active email provider configured" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Only Gmail and private servers support IMAP
    if (providerSettings.provider_type !== "gmail" && providerSettings.provider_type !== "private") {
      console.log("Provider does not support IMAP:", providerSettings.provider_type);
      return new Response(
        JSON.stringify({ message: "Provider does not support IMAP email fetching" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch emails via IMAP
    const emails = await fetchEmailsViaIMAP(providerSettings);
    console.log(`Fetched ${emails.length} emails`);

    // Process and store new emails
    let processedCount = 0;
    for (const email of emails) {
      try {
        // Check if this email is a reply to an existing thread
        const { data: existingEmail } = await supabase
          .from("emails")
          .select("id, customer_id")
          .eq("subject", email.subject.replace(/^Re:\s*/i, ""))
          .maybeSingle();

        if (existingEmail) {
          // Check if this reply already exists
          const { data: existingReply } = await supabase
            .from("email_replies")
            .select("id")
            .eq("message_id", email.messageId)
            .maybeSingle();

          if (!existingReply) {
            // Store as a reply
            await supabase.from("email_replies").insert({
              email_id: existingEmail.id,
              customer_id: existingEmail.customer_id,
              reply_body: email.body,
              subject: email.subject,
              from_address: email.from,
              message_id: email.messageId,
              received_at: email.date,
            });
            processedCount++;
            console.log(`Stored reply for email: ${email.subject}`);
          }
        }
      } catch (error) {
        console.error(`Error processing email ${email.messageId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fetched: emails.length,
        processed: processedCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in fetch-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

interface EmailMessage {
  messageId: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}

async function fetchEmailsViaIMAP(settings: any): Promise<EmailMessage[]> {
  // Note: Deno's IMAP support is limited. In production, you'd want to use a proper IMAP library
  // For now, this is a placeholder that shows the structure
  // You would need to implement actual IMAP connection here
  
  console.log("IMAP settings:", {
    host: settings.imap_host,
    port: settings.imap_port,
    username: settings.imap_username,
  });

  // This would connect to IMAP server and fetch recent emails
  // For demonstration purposes, returning empty array
  // In production, implement actual IMAP client
  
  return [];
  
  // Example structure of what would be returned:
  // return [
  //   {
  //     messageId: "unique-message-id",
  //     from: "customer@example.com",
  //     subject: "Re: Your inquiry",
  //     body: "Email content here",
  //     date: new Date().toISOString(),
  //   }
  // ];
}

serve(handler);
