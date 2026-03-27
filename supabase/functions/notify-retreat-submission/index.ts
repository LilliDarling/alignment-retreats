import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { isMailerSendConfigured, sendTemplateEmail, getTemplateId } from "../_shared/mailersend.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin email not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isMailerSendConfigured()) {
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data: RetreatSubmissionRequest = await req.json();

    const needsList = data.needs.map(need => {
      const note = data.needsNotes[need];
      return note ? `${need}: ${note}` : need;
    }).join(", ");

    const result = await sendTemplateEmail({
      to: ADMIN_EMAIL,
      templateId: getTemplateId("MAILERSEND_TEMPLATE_RETREAT_SUBMISSION"),
      variables: {
        title: data.title || "Untitled Retreat",
        submitter_name: data.submitterName,
        submitter_email: data.submitterEmail,
        expertise: data.expertise.length > 0 ? data.expertise.join(", ") : "Not specified",
        concept: data.whatYouOffer || "Not specified",
        needs: needsList || "None specified",
        earnings_per_person: data.earningsPerPerson ? `$${data.earningsPerPerson}/person` : "Not specified",
        preferred_dates: `${data.preferredDates || "Not specified"} ${data.datesFlexible ? "(Flexible)" : "(Fixed)"}`,
        sample_itinerary: data.sampleItinerary || "Not provided",
      },
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
