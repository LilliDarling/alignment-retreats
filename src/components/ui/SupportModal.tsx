"use client";

import { useState } from "react";
import { X, HelpCircle, CheckCircle2 } from "lucide-react";
import { useIsAuthenticated } from "@/lib/hooks/useAuth";
import { submitSupportRequest } from "@/lib/actions/contact";

const ISSUE_TYPES = [
  { value: "Billing or Payment", label: "Billing or Payment" },
  { value: "Technical Issue", label: "Technical Issue" },
  { value: "Account Help", label: "Account Help" },
  { value: "Retreat Question", label: "Retreat Question" },
  { value: "Venue Question", label: "Venue Question" },
  { value: "Other", label: "Other" },
];

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SupportModal({ open, onClose }: SupportModalProps) {
  const isAuthenticated = useIsAuthenticated();
  const [issueType, setIssueType] = useState("Other");
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    if (sending) return;
    onClose();
    setTimeout(() => {
      setIssueType("Other");
      setDetails("");
      setName("");
      setEmail("");
      setError(null);
      setSent(false);
    }, 300);
  };

  const handleSubmit = async () => {
    if (!details.trim() || sending) return;
    setSending(true);
    setError(null);

    const result = await submitSupportRequest({
      issueType,
      details,
      name: isAuthenticated ? undefined : name,
      email: isAuthenticated ? undefined : email,
    });

    setSending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">Get Support</h2>
            <p className="text-xs text-muted-foreground">
              We&apos;ll get back to you as soon as possible
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {sent ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <h3 className="text-base font-semibold mb-1">Message sent!</h3>
              <p className="text-sm text-muted-foreground">
                Our team has received your request and will respond shortly.
              </p>
              <button
                onClick={handleClose}
                className="mt-5 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Guest-only fields */}
              {!isAuthenticated && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </>
              )}

              {/* Issue type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  What can we help with?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ISSUE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setIssueType(type.value)}
                      className={`px-3 py-2 text-sm rounded-xl border text-left transition-colors ${
                        issueType === type.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Details
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe your issue or question..."
                  rows={4}
                  autoFocus={isAuthenticated}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) handleSubmit();
                  }}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={!details.trim() || sending}
                className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Support Request"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
