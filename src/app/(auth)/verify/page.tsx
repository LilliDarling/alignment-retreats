"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ArrowLeft, Mail } from "lucide-react";
import EmailVerificationPending from "@/components/auth/EmailVerificationPending";

function VerifyContent() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(prefillEmail);
  const [submitted, setSubmitted] = useState(!!prefillEmail);

  if (submitted && email) {
    return (
      <EmailVerificationPending
        email={email}
        onBack={() => setSubmitted(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>

      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-primary" />
      </div>

      <h1 className="text-2xl font-display text-foreground mb-3 text-center">
        Resend Verification Email
      </h1>
      <p className="text-muted-foreground mb-8 text-center">
        Enter the email you signed up with and we&apos;ll send a new
        verification link.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) setSubmitted(true);
        }}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
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
          disabled={!email.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send Verification Email
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
