import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

interface ProfileCompletedNotification {
  name: string;
  email: string;
  roles: string[];
  completedFields: string[];
}

const getRoleLabels = (roles: string[]): string => {
  const roleMap: Record<string, string> = {
    host: "Retreat Host",
    cohost: "Co-Host / Facilitator",
    landowner: "Venue Partner",
    staff: "Staff / Operations",
    creative: "Creative / Marketing",
    attendee: "Attendee",
  };

  return roles.map((role) => roleMap[role] || role).join(", ");
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required environment variables
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured", skipped: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!ADMIN_EMAIL) {
      console.error("ADMIN_EMAIL not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Admin email not configured", skipped: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, roles, completedFields }: ProfileCompletedNotification = await req.json();

    const roleLabels = getRoleLabels(roles);
    const completionDate = new Date().toLocaleString("en-US", {
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
      <body style="font-family: 'Source Sans 3', 'Cooper Hewitt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4b4132; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-family: 'Jost', 'Architype Bayer-Type', sans-serif; color: #4b4132; margin-bottom: 10px;">✅ Profile Completed!</h1>
        </div>
        
        <p style="font-size: 16px;">A member has completed their profile on Alignment Retreats.</p>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555; width: 120px;">Name:</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #4b4132;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555;">Roles:</td>
              <td style="padding: 8px 0;">${roleLabels}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555;">Completed:</td>
              <td style="padding: 8px 0;">${completionDate}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #dde6e6; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #4b4132;">Profile Updates:</p>
          <ul style="margin: 0; padding-left: 20px;">
            ${completedFields.map(field => `<li style="color: #555;">${field}</li>`).join('')}
          </ul>
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
        from: "Alignment Retreats <onboarding@alignmentretreats.xyz>",
        to: [ADMIN_EMAIL],
        subject: `✅ Profile Completed: ${name}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data.message || "Notification failed", emailError: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-profile-completed function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, emailError: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);