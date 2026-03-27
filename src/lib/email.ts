import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
});

const FROM = new Sender(
  process.env.MAILERSEND_FROM_EMAIL || "noreply@alignmentretreats.com",
  "Alignment Retreats"
);

const TEMPLATES = {
  retreatPublished: process.env.MAILERSEND_TEMPLATE_RETREAT_PUBLISHED || "",
  venuePublished: process.env.MAILERSEND_TEMPLATE_VENUE_PUBLISHED || "",
};

export async function sendPublishedEmail(
  to: string,
  type: "retreat" | "venue",
  name: string
) {
  const templateId = type === "retreat" ? TEMPLATES.retreatPublished : TEMPLATES.venuePublished;

  if (!templateId) {
    console.error(`No MailerSend template configured for ${type} published email`);
    return;
  }

  const emailParams = new EmailParams()
    .setFrom(FROM)
    .setTo([new Recipient(to)])
    .setTemplateId(templateId)
    .setPersonalization([
      {
        email: to,
        data: { name },
      },
    ]);

  try {
    await mailerSend.email.send(emailParams);
  } catch (err) {
    console.error(`Failed to send ${type} published email to ${to}:`, err);
  }
}
