import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Alignment Retreats",
  description: "Reset your Alignment Retreats account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
