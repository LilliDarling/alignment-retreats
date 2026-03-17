"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState("");
  const [showVerifyLink, setShowVerifyLink] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  // Prevent open redirect: only allow internal paths
  const redirect =
    rawRedirect.startsWith("/") && !rawRedirect.includes("//")
      ? rawRedirect
      : "/dashboard";
  const authError = searchParams.get("error");

  const supabase = createClient();

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowVerifyLink(false);

    if (!email.trim() || !password) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      if (signInError.message === "Email not confirmed") {
        setError(
          "Your email hasn't been verified yet. Check your inbox or resend the verification email."
        );
        setShowVerifyLink(true);
      } else {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Invalid email or password. Please try again."
            : signInError.message
        );
      }
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return;

    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/callback?redirect=${encodeURIComponent(redirect)}`,
        shouldCreateUser: false,
      },
    });
    setLoading(false);

    if (otpError) {
      setError(
        otpError.message === "Signups not allowed for otp"
          ? "No account found with this email. Please sign up first."
          : otpError.message
      );
      return;
    }

    setMagicLinkSent(true);
  }

  if (magicLinkSent) {
    return (
      <div className="w-full max-w-[420px] text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-3">Check your email</h1>
        <p className="text-muted-foreground mb-6">
          We sent a sign-in link to <strong className="text-foreground">{email}</strong>.
          Click the link in the email to sign in.
        </p>
        <button
          onClick={() => {
            setMagicLinkSent(false);
            setEmail("");
          }}
          className="text-sm text-primary hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="text-3xl font-display text-foreground mb-2">Welcome back</h1>
      <p className="text-muted-foreground mb-8">
        Sign in to manage your retreats and bookings.
      </p>

      {authError === "auth" && (
        <div className="mb-6 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          Authentication failed. Please try signing in again.
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
          {showVerifyLink && (
            <div className="mt-2">
              <Link
                href={`/verify${email ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
                className="text-primary hover:underline font-medium"
              >
                Resend verification email
              </Link>
            </div>
          )}
        </div>
      )}

      {useMagicLink ? (
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input-base"
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Send magic link
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={() => setUseMagicLink(false)}
            className="w-full px-4 py-3 rounded-[var(--radius-button)] border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors"
          >
            Sign in with password
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input-base"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="input-base pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={() => setUseMagicLink(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors"
          >
            <Mail className="w-4 h-4" />
            Sign in with Magic Link
          </button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${redirect !== "/dashboard" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="text-primary hover:underline font-medium"
        >
          Sign up
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground mt-2">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
        {" · "}
        <Link href="/verify" className="text-primary hover:underline">
          Resend verification email
        </Link>
      </p>
    </div>
  );
}
