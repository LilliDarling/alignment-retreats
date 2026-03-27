import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { isMailerSendConfigured, sendTemplateEmail, getTemplateId } from "../_shared/mailersend.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

interface NewMemberNotification {
  name: string;
  email: string;
  roles: string[];
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
    if (!isMailerSendConfigured()) {
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured", skipped: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin email not configured", skipped: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, roles }: NewMemberNotification = await req.json();

    const result = await sendTemplateEmail({
      to: ADMIN_EMAIL,
      templateId: getTemplateId("MAILERSEND_TEMPLATE_NEW_MEMBER"),
      variables: {
        name,
        email,
        roles: getRoleLabels(roles),
        signup_date: new Date().toLocaleString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit", timeZoneName: "short",
        }),
      },
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || "Notification failed", emailError: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-new-member function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, emailError: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
