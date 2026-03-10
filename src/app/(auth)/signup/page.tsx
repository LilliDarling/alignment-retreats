import { Suspense } from "react";
import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account | Alignment Retreats",
  description: "Create your Alignment Retreats account and join the retreat community.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
