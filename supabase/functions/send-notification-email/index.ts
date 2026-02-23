
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  subject: string;
  message: string;
  type: 'scrim_reminder' | 'match_update' | 'team_activity' | 'general';
  inviteUrl?: string; // Add optional invite URL
}

const getEmailTemplate = (message: string, type: string, inviteUrl?: string) => {
  const templates = {
    scrim_reminder: {
      header: "🎮 Scrim Reminder",
      color: "#00f5ff",
    },
    match_update: {
      header: "📈 Match Update",
      color: "#10b981",
    },
    team_activity: {
      header: "👥 Team Activity",
      color: "#8b5cf6",
    },
    general: {
      header: "📢 Notification",
      color: "#6366f1",
    },
  };

  const template = templates[type as keyof typeof templates] || templates.general;
  
  // Use invite URL if provided, otherwise use main dashboard
  const buttonUrl = inviteUrl || "https://scrimstats.gg";
  const buttonText = inviteUrl ? "Accept Invitation" : "View Dashboard";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ScrimStats Notification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, ${template.color} 0%, #1e293b 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${template.header}</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">ScrimStats</p>
          </div>
          <div style="padding: 40px 20px;">
            <div style="background-color: #f1f5f9; border-left: 4px solid ${template.color}; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">${message}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${buttonUrl}" style="display: inline-block; background-color: ${template.color}; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">${buttonText}</a>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              You're receiving this because you have notifications enabled in your ScrimStats settings.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { to, subject, message, type, inviteUrl }: NotificationEmailRequest = await req.json();

    console.log("Attempting to send email to:", to);
    console.log("Subject:", subject);
    console.log("Type:", type);
    console.log("Invite URL:", inviteUrl);

    if (!to || !subject || !message) {
      console.error("Missing required fields:", { to: !!to, subject: !!subject, message: !!message });
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, message" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Use your verified domain email.scrimstats.gg
    const emailResponse = await resend.emails.send({
      from: "ScrimStats <noreply@email.scrimstats.gg>",
      to: [to],
      subject: subject,
      html: getEmailTemplate(message, type || 'general', inviteUrl),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
