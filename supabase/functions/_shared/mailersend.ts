const MAILERSEND_API_KEY = Deno.env.get("MAILERSEND_API_KEY");
const FROM_EMAIL = Deno.env.get("MAILERSEND_FROM_EMAIL") || "noreply@alignmentretreats.com";
const FROM_NAME = "Alignment Retreats";

interface SendTemplateOptions {
  to: string;
  templateId: string;
  variables: Record<string, string>;
}

interface SendBatchTemplateOptions {
  templateId: string;
  recipients: Array<{ to: string; variables: Record<string, string> }>;
}

export function isMailerSendConfigured(): boolean {
  return !!MAILERSEND_API_KEY;
}

export function getTemplateId(envKey: string): string {
  return Deno.env.get(envKey) || "";
}

export async function sendTemplateEmail(
  { to, templateId, variables }: SendTemplateOptions
): Promise<{ success: boolean; error?: string }> {
  if (!MAILERSEND_API_KEY) {
    return { success: false, error: "MAILERSEND_API_KEY not configured" };
  }

  if (!templateId) {
    return { success: false, error: "Template ID not configured" };
  }

  const res = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MAILERSEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      template_id: templateId,
      personalization: [
        {
          email: to,
          data: variables,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("MailerSend API error:", text);
    return { success: false, error: text || "Email send failed" };
  }

  return { success: true };
}

export async function sendBatchTemplateEmails(
  { templateId, recipients }: SendBatchTemplateOptions
): Promise<{ sent: number; failed: number; errors: Array<{ email: string; error: string }> }> {
  const results = { sent: 0, failed: 0, errors: [] as Array<{ email: string; error: string }> };

  if (!MAILERSEND_API_KEY) {
    for (const r of recipients) {
      results.failed++;
      results.errors.push({ email: r.to, error: "MAILERSEND_API_KEY not configured" });
    }
    return results;
  }

  if (!templateId) {
    for (const r of recipients) {
      results.failed++;
      results.errors.push({ email: r.to, error: "Template ID not configured" });
    }
    return results;
  }

  const bulkBody = recipients.map((r) => ({
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: r.to }],
    template_id: templateId,
    personalization: [
      {
        email: r.to,
        data: r.variables,
      },
    ],
  }));

  try {
    const res = await fetch("https://api.mailersend.com/v1/bulk-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(bulkBody),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("MailerSend bulk API error:", text);
      for (const r of recipients) {
        results.failed++;
        results.errors.push({ email: r.to, error: text || "Bulk send failed" });
      }
    } else {
      results.sent = recipients.length;
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    for (const r of recipients) {
      results.failed++;
      results.errors.push({ email: r.to, error: errorMsg });
    }
  }

  return results;
}
