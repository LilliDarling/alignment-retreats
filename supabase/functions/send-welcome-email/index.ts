import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { isMailerSendConfigured, sendTemplateEmail, getTemplateId } from "../_shared/mailersend.ts";

interface WelcomeEmailRequest {
  name: string;
  email: string;
  roles: string[];
}

const isCollaborator = (roles: string[]): boolean => {
  const collaboratorRoles = ["host", "cohost", "landowner", "staff"];
  return roles.some(role => collaboratorRoles.includes(role));
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!isMailerSendConfigured()) {
      console.error("MAILERSEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured", skipped: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, roles }: WelcomeEmailRequest = await req.json();

    const isUserCollaborator = isCollaborator(roles);
    const templateId = isUserCollaborator
      ? getTemplateId("MAILERSEND_TEMPLATE_WELCOME_COLLABORATOR")
      : getTemplateId("MAILERSEND_TEMPLATE_WELCOME_ATTENDEE");

    const result = await sendTemplateEmail({
      to: email,
      templateId,
      variables: {
        name,
        roles: roles.join(", "),
      },
    });

    if (!result.success) {
      console.error("MailerSend error:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error || "Email send failed", emailError: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, emailError: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
