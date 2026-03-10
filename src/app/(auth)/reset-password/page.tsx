import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | Alignment Retreats",
  description: "Set a new password for your Alignment Retreats account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
