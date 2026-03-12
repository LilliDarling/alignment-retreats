import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("redirect") || "/dashboard";

  // Prevent open redirect — verify the resolved URL stays on the same origin
  const isValidRedirect = (path: string): boolean => {
    try {
      return new URL(path, origin).origin === origin;
    } catch {
      return false;
    }
  };
  const redirect = isValidRedirect(rawRedirect) ? rawRedirect : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
