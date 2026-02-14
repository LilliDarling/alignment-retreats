import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface WelcomeEmailRequest {
  name: string;
  email: string;
  roles: string[];
}

// Check if user is a collaborator (host, cohost, landowner, staff) vs attendee-only
const isCollaborator = (roles: string[]): boolean => {
  const collaboratorRoles = ["host", "cohost", "landowner", "staff"];
  return roles.some(role => collaboratorRoles.includes(role));
};

// Generate collaborator email content
const getCollaboratorEmailContent = (name: string, roles: string[]): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Source Sans 3', 'Cooper Hewitt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4b4132; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Jost', 'Architype Bayer-Type', sans-serif; color: #4b4132; margin-bottom: 10px;">Welcome to Alignment Retreats! 🌿</h1>
      </div>
      
      <p style="font-size: 16px;">Hi ${name},</p>
      
      <p style="font-size: 16px;">You've joined a community of world-class retreat collaborators. Here are your next steps:</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <ol style="margin: 0; padding-left: 20px; color: #555;">
          <li style="margin-bottom: 10px;"><strong>Connect Stripe:</strong> Go to your Dashboard to enable payouts.</li>
          <li style="margin-bottom: 10px;"><strong>Create Your First Retreat:</strong> Use our 3-step wizard to list your event.</li>
          <li style="margin-bottom: 10px;"><strong>Invite Your Team:</strong> Add venues and staff to automate split payments.</li>
        </ol>
      </div>
      
      <p style="font-size: 16px;">Your roles: ${roles.join(", ")}</p>
      
      <p style="font-size: 16px;">Let's create something amazing together!</p>
      <p style="font-size: 16px; margin-bottom: 0;">The Alignment Retreats Team</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">
        You received this email because you signed up for Alignment Retreats.
      </p>
    </body>
    </html>
  `;
};

// Generate attendee email content
const getAttendeeEmailContent = (name: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Source Sans 3', 'Cooper Hewitt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4b4132; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Jost', 'Architype Bayer-Type', sans-serif; color: #4b4132; margin-bottom: 10px;">Ready for Your Next Journey? 🌿</h1>
      </div>
      
      <p style="font-size: 16px;">Hi ${name},</p>
      
      <p style="font-size: 16px;">Welcome to Alignment Retreats! We're excited to help you discover transformative wellness experiences.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: 600;">What's next?</p>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li style="margin-bottom: 8px;">Browse our curated wellness retreats</li>
          <li style="margin-bottom: 8px;">Save your favorites</li>
          <li style="margin-bottom: 8px;">Book your spot with ease</li>
        </ul>
      </div>
      
      <p style="font-size: 16px;">Your journey to alignment starts now.</p>
      <p style="font-size: 16px; margin-bottom: 0;">The Alignment Retreats Team</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">
        You received this email because you signed up for Alignment Retreats.
      </p>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    const { name, email, roles }: WelcomeEmailRequest = await req.json();

    // Determine email type based on roles
    const isUserCollaborator = isCollaborator(roles);
    const htmlContent = isUserCollaborator 
      ? getCollaboratorEmailContent(name, roles)
      : getAttendeeEmailContent(name);
    
    const subject = isUserCollaborator
      ? "Welcome to Alignment Retreats - Let's Get Started!"
      : "Your Journey Begins - Welcome to Alignment Retreats!";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Alignment Retreats <onboarding@alignmentretreats.xyz>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      // Return success with error info instead of throwing - don't block signups
      return new Response(
        JSON.stringify({ success: false, error: data.message || "Email send failed", emailError: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    // Return 200 with error info - never block signup due to email failures
    return new Response(
      JSON.stringify({ success: false, error: error.message, emailError: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
