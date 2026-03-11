"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Send } from "lucide-react";
import { sendMessage } from "@/lib/actions/messages";

interface MessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientPhoto?: string | null;
  retreatId?: string | null;
  retreatTitle?: string | null;
  defaultMessageType?: "general" | "booking_inquiry" | "collaboration";
}

const MESSAGE_TYPES = [
  { value: "general", label: "General inquiry" },
  { value: "booking_inquiry", label: "Booking inquiry" },
  { value: "collaboration", label: "Collaboration request" },
] as const;

export default function MessageModal({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientPhoto,
  retreatId,
  retreatTitle,
  defaultMessageType = "general",
}: MessageModalProps) {
  const [messageType, setMessageType] = useState<"general" | "booking_inquiry" | "collaboration">(defaultMessageType);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultSubject =
    messageType === "booking_inquiry" && retreatTitle
      ? `Booking inquiry for ${retreatTitle}`
      : messageType === "collaboration" && retreatTitle
        ? `Collaboration request for ${retreatTitle}`
        : "";

  const handleSend = async () => {
    const finalSubject = subject.trim() || defaultSubject;
    if (!finalSubject || !body.trim()) {
      setError("Please fill in both subject and message.");
      return;
    }

    setSending(true);
    setError(null);

    const result = await sendMessage(recipientId, finalSubject, body, messageType, retreatId);

    setSending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setSubject("");
    setBody("");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Send a message</h2>
            <p className="text-sm text-muted-foreground">
              {retreatTitle ? `Regarding: ${retreatTitle}` : `To ${recipientName}`}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Recipient */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
              {recipientPhoto ? (
                <Image src={recipientPhoto} alt="" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">{recipientName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">To</p>
              <p className="text-sm font-medium text-foreground">{recipientName}</p>
            </div>
          </div>

          {/* Message Type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Message type
            </label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as typeof messageType)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MESSAGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Subject
            </label>
            <input
              type="text"
              placeholder={defaultSubject || "Enter subject..."}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Message
            </label>
            <textarea
              placeholder="Write your message here..."
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending..." : "Send message"}
          </button>
        </div>
      </div>
    </div>
  );
}
