"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmailVerificationPendingProps } from "@/types/auth";

export default function EmailVerificationPending({
  email,
  onBack,
}: EmailVerificationPendingProps) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleResendVerification() {
    if (cooldown > 0) return;

    setResending(true);
    setResendSuccess(false);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "resend-verification-email",
        { body: { email } }
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setResendSuccess(true);

      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Please try again later.";
      setError(message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      {/* Back */}
      <div className="mb-8">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        )}
      </div>

      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-display text-foreground mb-3">
          Check Your Email
        </h1>
        <p className="text-muted-foreground mb-1">
          We&apos;ve sent a verification link to
        </p>
        <p className="font-medium text-foreground mb-8">{email}</p>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-[var(--radius-card)] p-4 text-left mb-6">
          <h4 className="font-medium text-foreground text-sm mb-2">
            What to do next:
          </h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Open your email inbox</li>
            <li>Find the email from Alignment Retreats</li>
            <li>Click the verification link</li>
            <li>You&apos;ll be redirected to sign in</li>
          </ol>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Resend */}
        <p className="text-sm text-muted-foreground mb-3">
          Didn&apos;t receive the email? Check your spam folder or
        </p>

        <button
          onClick={handleResendVerification}
          disabled={resending || cooldown > 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : resendSuccess && cooldown > 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-primary" />
              Sent! Resend in {cooldown}s
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Resend Verification Email
            </>
          )}
        </button>

        {/* Sign in link */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Already verified?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
