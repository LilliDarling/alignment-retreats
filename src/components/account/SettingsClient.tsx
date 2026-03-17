"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Mail,
  Eye,
  Trash2,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  updateDirectoryVisibility,
  updateNewsletterOptIn,
} from "@/lib/actions/profile";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    createdAt: string;
    roles: string[];
  };
  initialSettings: {
    showInDirectory: boolean;
    newsletterOptIn: boolean;
  };
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Feedback({ state }: { state: FeedbackState }) {
  if (!state) return null;
  return (
    <p
      className={`flex items-center gap-1.5 text-sm mt-2 ${
        state.type === "success" ? "text-green-600" : "text-destructive"
      }`}
    >
      {state.type === "success" ? (
        <CheckCircle className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      {state.message}
    </p>
  );
}

export default function SettingsClient({
  user,
  initialSettings,
}: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // Password
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null);

  // Privacy
  const [showInDirectory, setShowInDirectory] = useState(
    initialSettings.showInDirectory
  );
  const [directorySaving, setDirectorySaving] = useState(false);
  const [directoryFeedback, setDirectoryFeedback] =
    useState<FeedbackState>(null);

  // Newsletter
  const [newsletterOptIn, setNewsletterOptIn] = useState(
    initialSettings.newsletterOptIn
  );
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] =
    useState<FeedbackState>(null);

  // Delete
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<FeedbackState>(null);

  const roleLabel = (r: string) =>
    r === "landowner" ? "Venue Owner" : r.charAt(0).toUpperCase() + r.slice(1);

  async function handlePasswordReset() {
    setPasswordFeedback(null);
    setPasswordSaving(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPasswordSaving(false);
    if (error) {
      setPasswordFeedback({ type: "error", message: error.message });
    } else {
      setPasswordFeedback({
        type: "success",
        message: "Password reset link sent to your email.",
      });
    }
  }

  async function handleDirectoryToggle(checked: boolean) {
    const previous = showInDirectory;
    setShowInDirectory(checked);
    setDirectorySaving(true);
    setDirectoryFeedback(null);
    const { error } = await updateDirectoryVisibility(checked);
    setDirectorySaving(false);
    if (error) {
      setShowInDirectory(previous);
      setDirectoryFeedback({ type: "error", message: error });
    } else {
      setDirectoryFeedback({
        type: "success",
        message: checked ? "Visible in directory." : "Hidden from directory.",
      });
    }
  }

  async function handleNewsletterToggle(checked: boolean) {
    const previous = newsletterOptIn;
    setNewsletterOptIn(checked);
    setNewsletterSaving(true);
    setNewsletterFeedback(null);
    const { error } = await updateNewsletterOptIn(checked);
    if (error) {
      setNewsletterOptIn(previous);
      setNewsletterSaving(false);
      setNewsletterFeedback({ type: "error", message: error });
      return;
    }
    // Sync with Mailchimp (best-effort)
    await supabase.functions.invoke("mailchimp-subscribe", {
      body: { email: user.email, subscribe: checked },
    });
    setNewsletterSaving(false);
    setNewsletterFeedback({
      type: "success",
      message: checked ? "Subscribed to newsletter." : "Unsubscribed.",
    });
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    setDeleteFeedback(null);
    const { error } = await supabase.functions.invoke("delete-account", {
      body: { userId: user.id },
    });
    if (error) {
      setDeleting(false);
      setDeleteFeedback({
        type: "error",
        message: "Failed to delete account. Please contact support.",
      });
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account preferences and security.
          </p>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-muted-foreground" />
              Account
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="text-sm text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Roles</p>
              <div className="flex flex-wrap gap-2">
                {user.roles.length > 0 ? (
                  user.roles.map((r) => (
                    <Badge key={r} variant="primary">
                      {roleLabel(r)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="muted">Member</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Member since
              </p>
              <p className="text-sm text-foreground">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              Password
            </CardTitle>
            <CardDescription>
              Reset your password via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a secure reset link to{" "}
              <span className="font-medium text-foreground">{user.email}</span>.
            </p>
            <Feedback state={passwordFeedback} />
            <Button
              onClick={handlePasswordReset}
              disabled={passwordSaving}
              size="sm"
            >
              {passwordSaving && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Send Reset Link
            </Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="w-4 h-4 text-muted-foreground" />
              Privacy
            </CardTitle>
            <CardDescription>
              Control your visibility and data
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Show in Directory
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Allow other members to find your profile in the community
                  directory
                </p>
              </div>
              <Toggle
                checked={showInDirectory}
                onChange={handleDirectoryToggle}
                disabled={directorySaving}
              />
            </div>
            <Feedback state={directoryFeedback} />
          </CardContent>
        </Card>

        {/* Newsletter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email Preferences
            </CardTitle>
            <CardDescription>
              Manage how we communicate with you
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Newsletter & Updates
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive retreat highlights, community news, and opportunities
                </p>
              </div>
              <Toggle
                checked={newsletterOptIn}
                onChange={handleNewsletterToggle}
                disabled={newsletterSaving}
              />
            </div>
            <Feedback state={newsletterFeedback} />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-600">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions on your account</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Deleting your account is permanent. All your data — profile,
              bookings, listings, and messages — will be removed and cannot be
              recovered.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmText("");
              setDeleteFeedback(null);
            }}
          />
          <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">
              Delete Your Account?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. Your profile, bookings, listings,
              and all data will be permanently deleted.
            </p>
            <p className="text-sm font-medium text-foreground mb-2">
              Type{" "}
              <span className="font-mono font-bold text-red-600">DELETE</span>{" "}
              to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors mb-4"
            />
            <Feedback state={deleteFeedback} />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setDeleteFeedback(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
