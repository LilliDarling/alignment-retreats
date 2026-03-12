"use server";

import * as EmailValidator from "email-validator";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "./messages";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_EMAIL = 5;
const MAX_SUPPORT_MESSAGES_PER_USER = 10;

async function isEmailRateLimited(supabase: Awaited<ReturnType<typeof createClient>>, email: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from("contact_submissions")
    .select("id", { count: "exact", head: true })
    .eq("email", email.trim().toLowerCase())
    .gte("created_at", since);
  return (count ?? 0) >= MAX_SUBMISSIONS_PER_EMAIL;
}

async function isUserRateLimited(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", userId)
    .ilike("subject", "Support:%")
    .gte("created_at", since);
  return (count ?? 0) >= MAX_SUPPORT_MESSAGES_PER_USER;
}

export async function submitSupportRequest(data: {
  issueType: string;
  details: string;
  name?: string;
  email?: string;
}): Promise<{ error: string | null }> {
  if (!data.details.trim()) return { error: "Please describe your issue." };
  if (data.details.length > 3000) return { error: "Details must be 3,000 characters or fewer." };
  if ((data.name?.length ?? 0) > 100) return { error: "Name must be 100 characters or fewer." };
  if ((data.issueType?.length ?? 0) > 100) return { error: "Issue type must be 100 characters or fewer." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const subject = `Support: ${data.issueType}`;

  if (user) {
    if (await isUserRateLimited(supabase, user.id))
      return { error: "Too many support requests. Please wait before submitting again." };

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
  if (!data.email?.trim() || !EmailValidator.validate(data.email))
    return { error: "A valid email address is required." };
  if (await isEmailRateLimited(supabase, data.email))
    return { error: "Too many requests from this email. Please wait before submitting again." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("contact_submissions").insert({
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    subject,
    message: data.details.trim(),
  });

  if (error) return { error: error.message };
  return { error: null };
}

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const isAdmin = (roles || []).some((r) => r.role === "admin");
  if (!isAdmin) return { error: "Not authorized" };
  return { userId: user.id };
}

export async function markContactSubmissionRead(id: string): Promise<{ error: string | null }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("contact_submissions")
    .update({ read: true })
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function markContactSubmissionResolved(id: string, resolved: boolean): Promise<{ error: string | null }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("contact_submissions")
    .update({ resolved, read: true })
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
  if (data.name.length > 100) return { error: "Name must be 100 characters or fewer." };
  if (!data.email.trim() || !EmailValidator.validate(data.email))
    return { error: "A valid email address is required." };
  if (!data.subject.trim()) return { error: "Subject is required." };
  if (data.subject.length > 200) return { error: "Subject must be 200 characters or fewer." };
  if (!data.message.trim()) return { error: "Message is required." };
  if (data.message.length > 3000) return { error: "Message must be 3,000 characters or fewer." };

  const supabase = await createClient();
  if (await isEmailRateLimited(supabase, data.email))
    return { error: "Too many requests from this email. Please wait before submitting again." };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("contact_submissions").insert({
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    subject: data.subject.trim(),
    message: data.message.trim(),
  });

  if (error) return { error: error.message };
  return { error: null };
}
