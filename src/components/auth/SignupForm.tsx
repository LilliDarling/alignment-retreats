"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Search,
  Users,
  Handshake,
  Home,
  Briefcase,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/types/auth";
import EmailVerificationPending from "./EmailVerificationPending";

const attendeeOption = {
  value: "attendee" as AppRole,
  label: "Attendee",
  description: "Discover and book retreats",
  icon: Search,
};

const collaboratorOptions: {
  value: AppRole;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  { value: "host", label: "Host", description: "Lead your own retreats", icon: Users },
  { value: "cohost", label: "Co-Host / Facilitator", description: "Partner with other hosts", icon: Handshake },
  { value: "landowner", label: "Venue Partner", description: "List your venue or property for retreats", icon: Home },
  { value: "staff", label: "Staff / Operations", description: "Offer services like catering or wellness", icon: Briefcase },
];

function RoleCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors " +
        (checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-transparent")
      }
    >
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}

type FlowStep = "role-selection" | "host-message" | "account-creation";

export default function SignupForm() {
  const [step, setStep] = useState<FlowStep>("role-selection");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userTypes, setUserTypes] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { signUp } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const toggleRole = (role: AppRole) => {
    setUserTypes((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const hasRolesSelected = userTypes.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!hasRolesSelected) {
      setError("Select at least one role");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(
        email.trim(),
        password,
        name.trim(),
        userTypes
      );

      if (signUpError) {
        setError(
          signUpError.message.includes("already registered")
            ? "An account with this email already exists. Please sign in instead."
            : signUpError.message
        );
        setLoading(false);
        return;
      }

      setSignupSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (signupSuccess) {
    return <EmailVerificationPending email={email} />;
  }

  return (
    <div className="w-full max-w-[480px]">
      <h1 className="text-3xl font-display text-foreground mb-2">
        Join Alignment Retreats
      </h1>
      <p className="text-muted-foreground mb-8">
        {step === "role-selection"
          ? "How will you use the platform?"
          : step === "host-message"
            ? "A quick note about hosting"
            : "Create your account"}
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {step === "role-selection" && (
        <div className="space-y-4">
          {/* Attendee */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Find Retreats
            </p>
            <button
              type="button"
              onClick={() => toggleRole(attendeeOption.value)}
              className={
                "w-full flex items-start gap-4 p-5 rounded-[var(--radius-card)] border-2 transition-all text-left " +
                (userTypes.includes(attendeeOption.value)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30")
              }
            >
              <RoleCheckbox checked={userTypes.includes(attendeeOption.value)} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <attendeeOption.icon className="h-4 w-4 text-primary" />
                  <p className="font-medium text-foreground">{attendeeOption.label}</p>
                </div>
                <p className="text-sm text-muted-foreground">{attendeeOption.description}</p>
              </div>
            </button>
          </div>

          {/* Collaborator roles */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Collaborate
            </p>
            <div className="grid gap-3">
              {collaboratorOptions.map((role) => (
                <button
                  type="button"
                  key={role.value}
                  onClick={() => toggleRole(role.value)}
                  className={
                    "w-full flex items-start gap-4 p-5 rounded-[var(--radius-card)] border-2 transition-all text-left " +
                    (userTypes.includes(role.value)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30")
                  }
                >
                  <RoleCheckbox checked={userTypes.includes(role.value)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <role.icon className="h-4 w-4 text-primary" />
                      <p className="font-medium text-foreground">{role.label}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </button>
              ))}

            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!hasRolesSelected) {
                setError("Select at least one role");
                return;
              }
              setError("");
              if (userTypes.includes("host" as AppRole)) {
                setStep("host-message");
              } else {
                setStep("account-creation");
              }
            }}
            disabled={!hasRolesSelected}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      )}

      {step === "host-message" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-muted/50 p-5 text-muted-foreground space-y-3">
            <p>
              Hosting retreats through Alignment Retreats is{" "}
              <span className="font-semibold text-foreground">
                open to everyone
              </span>
              .
            </p>
            <p>
              If you&apos;d like to participate as a co-founder in the Alignment
              Retreats Co-Op — including profit sharing and governance — you may
              choose to join the Co-Op Foundation separately.
            </p>
            <p className="text-sm">
              <span className="font-medium text-foreground">Note:</span> Co-Op
              members don&apos;t pay deposit fees for their retreats.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setStep("account-creation")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Continue as Host
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/cooperative"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] border-2 border-border text-foreground font-medium hover:border-primary/30 transition-colors"
            >
              Learn About Co-Op Co-Founder Membership
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setStep("role-selection")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back
          </button>
        </div>
      )}

      {step === "account-creation" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="input-base"
              autoComplete="name"
            />
          </div>

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
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="input-base pr-10"
                autoComplete="new-password"
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
            disabled={loading || !email.trim() || !name.trim() || !password}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() =>
                setStep(
                  userTypes.includes("host" as AppRole)
                    ? "host-message"
                    : "role-selection"
                )
              }
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Back
            </button>
            <p className="text-sm text-muted-foreground">
              Have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
