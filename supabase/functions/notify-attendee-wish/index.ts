import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

interface AttendeeWishRequest {
  retreatTypes: string[];
  desiredExperiences: string[];
  description: string;
  preferredTimeframe: string;
  locationPreferences: string[];
  internationalOk: boolean;
  budgetMin: number;
  budgetMax: number;
  budgetFlexibility: string;
  groupSize: number;
  bringingOthers: boolean;
  priority: string | null;
  submitterName: string;
  submitterEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate ADMIN_EMAIL is configured
    if (!ADMIN_EMAIL) {
      console.error("ADMIN_EMAIL not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Admin email not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data: AttendeeWishRequest = await req.json();

    const emailHtml = `
      <div style="font-family: 'Source Sans 3', 'Cooper Hewitt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #4b4132;">
        <div style="background: linear-gradient(135deg, #4b4132, #6b6152); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="font-family: 'Jost', 'Architype Bayer-Type', sans-serif; color: white; margin: 0; font-size: 24px;">💜 New Dream Retreat Submission!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #6b7280; margin-top: 0;">Someone is looking for their perfect retreat experience.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Submitted By</h3>
            <p style="margin: 0; font-size: 16px;"><strong>${data.submitterName}</strong></p>
            <p style="margin: 5px 0 0; color: #6b7280;">${data.submitterEmail}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Retreat Types</h3>
            <p style="margin: 0;">${data.retreatTypes.length > 0 ? data.retreatTypes.join(", ") : "Open to all types"}</p>
          </div>

          ${data.desiredExperiences.length > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Desired Experiences</h3>
            <p style="margin: 0;">${data.desiredExperiences.join(", ")}</p>
          </div>
          ` : ""}

          ${data.description ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Their Vision</h3>
            <p style="margin: 0; white-space: pre-wrap;">${data.description}</p>
          </div>
          ` : ""}

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Location & Timing</h3>
            <p style="margin: 0;"><strong>Locations:</strong> ${data.locationPreferences.length > 0 ? data.locationPreferences.join(", ") : "Flexible"}</p>
            <p style="margin: 10px 0 0;"><strong>International OK:</strong> ${data.internationalOk ? "Yes" : "No"}</p>
            <p style="margin: 10px 0 0;"><strong>Timeframe:</strong> ${data.preferredTimeframe || "Not specified"}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Budget & Group</h3>
            <p style="margin: 0;"><strong>Budget Range:</strong> $${data.budgetMin.toLocaleString()} - $${data.budgetMax.toLocaleString()}</p>
            <p style="margin: 10px 0 0;"><strong>Flexibility:</strong> ${data.budgetFlexibility}</p>
            <p style="margin: 10px 0 0;"><strong>Group Size:</strong> ${data.groupSize} ${data.bringingOthers ? "(bringing others)" : "(solo)"}</p>
          </div>

          ${data.priority ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Top Priority</h3>
            <p style="margin: 0; font-size: 16px; text-transform: capitalize;"><strong>${data.priority}</strong></p>
          </div>
          ` : ""}

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">
            This is an automated notification from Alignment Retreats.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Alignment Retreats <onboarding@alignmentretreats.xyz>",
      to: [ADMIN_EMAIL],
      subject: `💜 New Dream Retreat Request from ${data.submitterName}`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: emailResponse.error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-attendee-wish:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
