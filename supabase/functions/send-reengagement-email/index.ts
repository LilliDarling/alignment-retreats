import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SITE_URL = "https://alignmentretreats.xyz";
const FROM_EMAIL = "Alignment Retreats <hello@alignmentretreats.xyz>";

const CALENDLY_URL = "https://calendly.com/mathew-vetten/co-op-onboarding";

const getEmailHtml = (name: string): string => {
  const loginUrl = `${SITE_URL}/login`;
  const cooperativeUrl = `${SITE_URL}/cooperative`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #40302A; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F0E8;">
      <div style="background-color: #F5F0E8; padding: 30px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #C2603A; margin: 0; font-size: 24px; font-weight: 700;">Alignment Retreats</h1>
        </div>

        <!-- Main Card -->
        <div style="background-color: #FDFBF8; border-radius: 12px; padding: 32px; margin-bottom: 24px; border: 1px solid #E8DDD1;">
          <p style="font-size: 16px; margin-top: 0;">Hey,</p>

          <p style="font-size: 16px;">It's been a minute! We've had our heads down building out Alignment Retreats — and honestly, there's still a ton left to do. But we just got our <strong>first retreat listing</strong> live on the site and couldn't keep that to ourselves.</p>

          <p style="font-size: 16px;">We've switched to <strong>magic links</strong> for logging in during construction. Once the dashboard is back up, we will have you change your passwords. For now, just pop in your email on the login page for the magic link, check your inbox, and go from there!</p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginUrl}" style="display: inline-block; background-color: #C2603A; color: #FDFBF8; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 16px; font-weight: 700;">Log In to Your Account</a>
          </div>

        <!-- Dashboard Coming Soon Card -->
        <div style="background-color: #FDFBF8; border-radius: 12px; padding: 24px 32px; margin-bottom: 24px; border: 1px solid #E8DDD1;">
          <p style="margin: 0 0 8px 0; font-weight: 700; color: #8B6B54; font-size: 15px;">A note on dashboards</p>
          <p style="font-size: 15px; margin: 0; color: #6B5548;">Full access to your personalised dashboard is coming soon. We're putting the finishing touches on it and will let you know the moment it's ready. In the meantime, feel free to explore the site, browse our first retreat, and get a feel for where we're headed.</p>
        </div>

        <!-- Co-Founder CTA Card -->
        <div style="background-color: #FDFBF8; border-radius: 12px; padding: 24px 32px; margin-bottom: 24px; border: 1px solid #E8DDD1;">
          <p style="margin: 0 0 8px 0; font-weight: 700; color: #C2603A; font-size: 15px;">Interested in becoming a Co-Founder?</p>
          <p style="font-size: 15px; margin: 0 0 16px 0; color: #6B5548;">Alignment Retreats is structured as a co-operative. If you're passionate about what we're building and want to be part of it — including profit sharing and governance — we'd love to chat with you about co-founder membership.</p>
          <div style="text-align: center;">
            <a href="${CALENDLY_URL}" style="display: inline-block; background-color: #8B6B54; color: #FDFBF8; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 15px; font-weight: 700;">Book a Discovery Call</a>
          </div>
          <p style="font-size: 13px; margin: 12px 0 0 0; color: #A0917E; text-align: center;">
            <a href="${cooperativeUrl}" style="color: #C2603A; text-decoration: underline;">Learn more about the Co-Op</a>
          </p>
        </div>

        <!-- Sign-off -->
        <div style="background-color: #FDFBF8; border-radius: 12px; padding: 24px 32px; margin-bottom: 24px; border: 1px solid #E8DDD1;">
          <p style="font-size: 16px; margin: 0 0 8px 0;">Thanks for sticking with us — it means a lot. More updates coming soon!</p>
          <p style="font-size: 16px; margin: 0;">Cheers,<br><strong>The Alignment Retreats Team</strong></p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 8px;">
          <p style="font-size: 12px; color: #A0917E; margin: 0;">
            You received this email because you have an account on Alignment Retreats.<br>
            <a href="${SITE_URL}" style="color: #C2603A;">alignmentretreats.xyz</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

interface UserRecord {
  email: string;
  name: string;
}

async function fetchAllUsers(supabaseAdmin: ReturnType<typeof createClient>): Promise<UserRecord[]> {
  const users: UserRecord[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error(`Error fetching users page ${page}:`, error.message);
      break;
    }

    if (!data.users || data.users.length === 0) break;

    for (const user of data.users) {
      if (user.email && !user.deleted_at && !user.is_anonymous) {
        users.push({
          email: user.email,
          name: user.user_metadata?.name || user.email.split("@")[0],
        });
      }
    }

    if (data.users.length < perPage) break;
    page++;
  }

  return users;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "SUPABASE_SERVICE_ROLE_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Optional: pass ?dry_run=true to preview without sending
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const users = await fetchAllUsers(supabaseAdmin);
    console.log(`Found ${users.length} users to email`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          user_count: users.length,
          users: users.map((u) => ({ email: u.email, name: u.name })),
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send emails in batches of 50 using Resend batch API
    const batchSize = 50;
    const results = { sent: 0, failed: 0, errors: [] as Array<{ email: string; error: string }> };

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const emails = batch.map((user) => ({
        from: FROM_EMAIL,
        to: [user.email],
        subject: "We've Missed You — Come See What We've Been Building",
        html: getEmailHtml(user.name),
      }));

      try {
        const res = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify(emails),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(`Batch ${i / batchSize + 1} failed:`, data);
          for (const user of batch) {
            results.failed++;
            results.errors.push({ email: user.email, error: data.message || "Batch send failed" });
          }
        } else {
          results.sent += batch.length;
          console.log(`Batch ${i / batchSize + 1}: sent ${batch.length} emails`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Batch ${i / batchSize + 1} error:`, errorMsg);
        for (const user of batch) {
          results.failed++;
          results.errors.push({ email: user.email, error: errorMsg });
        }
      }

      // Rate limit: pause between batches
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reengagement-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
