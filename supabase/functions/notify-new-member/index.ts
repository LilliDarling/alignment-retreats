import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "mathew.vetten@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewMemberNotification {
  name: string;
  email: string;
  roles: string[];
}

const getRoleLabels = (roles: string[]): string => {
  const roleMap: Record<string, string> = {
    host: "Retreat Host",
    cohost: "Co-Host",
    landowner: "Landowner / Venue",
    staff: "Staff / Contractor",
    attendee: "Attendee",
  };

  return roles.map((role) => roleMap[role] || role).join(", ");
};

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-new-member function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key exists
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured", skipped: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, roles }: NewMemberNotification = await req.json();

    console.log(`Notifying admin about new member: ${name} (${email})`);

    const roleLabels = getRoleLabels(roles);
    const signupDate = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2d5016; margin-bottom: 10px;">🎉 New Member Joined!</h1>
        </div>
        
        <p style="font-size: 16px;">Great news! A new member has joined Alignment Retreats.</p>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555; width: 100px;">Name:</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2d5016;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555;">Roles:</td>
              <td style="padding: 8px 0;">${roleLabels}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555;">Joined:</td>
              <td style="padding: 8px 0;">${signupDate}</td>
            </tr>
          </table>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">
          This is an automated notification from Alignment Retreats.
        </p>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Alignment Retreats <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🎉 New Alignment Retreats Member: ${name}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      // Return success with error info instead of throwing
      return new Response(
        JSON.stringify({ success: false, error: data.message || "Notification failed", emailError: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin notification sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-new-member function:", error);
    // Return 200 with error info - never block signup due to notification failures
    return new Response(
      JSON.stringify({ success: false, error: error.message, emailError: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);