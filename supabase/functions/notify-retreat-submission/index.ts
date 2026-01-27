import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface RetreatSubmissionRequest {
  title: string;
  expertise: string[];
  whatYouOffer: string;
  needs: string[];
  needsNotes: Record<string, string>;
  earningsPerPerson: string;
  preferredDates: string;
  datesFlexible: boolean;
  sampleItinerary: string;
  submitterName: string;
  submitterEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-retreat-submission function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: RetreatSubmissionRequest = await req.json();
    console.log("Received retreat submission from:", data.submitterName);

    const needsList = data.needs.map(need => {
      const note = data.needsNotes[need];
      return note ? `• ${need}: ${note}` : `• ${need}`;
    }).join("\n");

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2d5016, #4a7c23); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🌿 New Retreat Submission!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827; margin-top: 0;">${data.title || "Untitled Retreat"}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Submitted By</h3>
            <p style="margin: 0; font-size: 16px;"><strong>${data.submitterName}</strong></p>
            <p style="margin: 5px 0 0; color: #6b7280;">${data.submitterEmail}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Expertise Areas</h3>
            <p style="margin: 0;">${data.expertise.length > 0 ? data.expertise.join(", ") : "Not specified"}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Retreat Concept</h3>
            <p style="margin: 0; white-space: pre-wrap;">${data.whatYouOffer || "Not specified"}</p>
          </div>

          ${data.needs.length > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">What They Need</h3>
            <pre style="margin: 0; white-space: pre-wrap; font-family: inherit;">${needsList}</pre>
          </div>
          ` : ""}

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Financial & Timing</h3>
            <p style="margin: 0;"><strong>Target Earnings:</strong> ${data.earningsPerPerson ? `$${data.earningsPerPerson}/person` : "Not specified"}</p>
            <p style="margin: 10px 0 0;"><strong>Preferred Dates:</strong> ${data.preferredDates || "Not specified"} ${data.datesFlexible ? "(Flexible)" : "(Fixed)"}</p>
          </div>

          ${data.sampleItinerary ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Sample Itinerary</h3>
            <pre style="margin: 0; white-space: pre-wrap; font-family: inherit; font-size: 14px; color: #4b5563;">${data.sampleItinerary}</pre>
          </div>
          ` : ""}

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">
            This is an automated notification from Alignment Retreats.
          </p>
        </div>
      </div>
    `;

    console.log("Sending retreat submission email to mathew.vetten@gmail.com");

    const emailResponse = await resend.emails.send({
      from: "Alignment Retreats <onboarding@resend.dev>",
      to: ["mathew.vetten@gmail.com"],
      subject: `🌿 New Retreat Submission: ${data.title || "Untitled Retreat"}`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: emailResponse.error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", emailResponse.data);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-retreat-submission:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);