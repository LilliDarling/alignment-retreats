"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "./messages";

export async function submitSupportRequest(data: {
  issueType: string;
  details: string;
  name?: string;
  email?: string;
}): Promise<{ error: string | null }> {
  if (!data.details.trim()) return { error: "Please describe your issue." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const subject = `Support: ${data.issueType}`;

  if (user) {
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .neq("user_id", user.id);

    if (!adminRoles?.length) {
      return { error: "No support team available. Please email us directly." };
    }

    const results = await Promise.allSettled(
      (adminRoles as { user_id: string }[]).map((r) =>
        sendMessage(r.user_id, subject, data.details.trim(), "general")
      )
    );

    const hasSuccess = results.some(
      (r) => r.status === "fulfilled" && !("error" in (r as PromiseFulfilledResult<{ id: string } | { error: string }>).value)
    );
    if (!hasSuccess) return { error: "Failed to send. Please try again." };
    return { error: null };
  }

  // Unauthenticated — validate then insert into contact_submissions
  if (!data.name?.trim()) return { error: "Name is required." };
  if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return { error: "A valid email address is required." };

  const { error } = await supabase.from("contact_submissions").insert({
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    subject,
    message: data.details.trim(),
  } as never);

  if (error) return { error: error.message };
  return { error: null };
}

export async function markContactSubmissionRead(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_submissions")
    .update({ read: true } as never)
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function markContactSubmissionResolved(id: string, resolved: boolean): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_submissions")
    .update({ resolved, read: true } as never)
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ error: string | null }> {
  if (!data.name.trim()) return { error: "Name is required." };
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return { error: "A valid email address is required." };
  if (!data.subject.trim()) return { error: "Subject is required." };
  if (!data.message.trim()) return { error: "Message is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    subject: data.subject.trim(),
    message: data.message.trim(),
  } as never);

  if (error) return { error: error.message };
  return { error: null };
}
