"use client";

import { useState } from "react";
import {
  Mail,
  ChevronDown,
  ChevronUp,
  Inbox,
  CheckCircle2,
  Circle,
  RotateCcw,
  Archive,
  ArchiveRestore,
  Trash2,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import type { ContactSubmission } from "@/lib/queries/admin";
import {
  markContactSubmissionRead,
  markContactSubmissionResolved,
  archiveContactSubmission,
  deleteContactSubmission,
} from "@/lib/actions/contact";

interface ContactSubmissionsTabProps {
  submissions: ContactSubmission[];
}

type Filter = "open" | "resolved" | "archived";

export default function ContactSubmissionsTab({ submissions: initial }: ContactSubmissionsTabProps) {
  const [submissions, setSubmissions] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [loading, setLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const open = submissions.filter((s) => !s.resolved && !s.archived);
  const resolved = submissions.filter((s) => s.resolved && !s.archived);
  const archived = submissions.filter((s) => s.archived);
  const unreadCount = open.filter((s) => !s.read).length;
  const visible = filter === "open" ? open : filter === "resolved" ? resolved : archived;

  const handleExpand = async (sub: ContactSubmission) => {
    if (expanded === sub.id) {
      setExpanded(null);
      return;
    }
    setExpanded(sub.id);
    if (!sub.read) {
      await markContactSubmissionRead(sub.id);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, read: true } : s))
      );
    }
  };

  const handleResolve = async (sub: ContactSubmission) => {
    setLoading(sub.id);
    await markContactSubmissionResolved(sub.id, true);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, resolved: true, read: true } : s))
    );
    setExpanded(null);
    setLoading(null);
  };

  const handleReopen = async (sub: ContactSubmission) => {
    setLoading(sub.id);
    await markContactSubmissionResolved(sub.id, false);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, resolved: false } : s))
    );
    setLoading(null);
  };

  const handleArchive = async (sub: ContactSubmission) => {
    setLoading(sub.id);
    await archiveContactSubmission(sub.id, true);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, archived: true } : s))
    );
    setExpanded(null);
    setLoading(null);
  };

  const handleUnarchive = async (sub: ContactSubmission) => {
    setLoading(sub.id);
    await archiveContactSubmission(sub.id, false);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, archived: false } : s))
    );
    setLoading(null);
  };

  const handleDelete = async (sub: ContactSubmission) => {
    if (!confirm(`Delete submission from "${sub.name}"? This cannot be undone.`)) return;
    setLoading(sub.id);
    await deleteContactSubmission(sub.id);
    setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
    setExpanded(null);
    setLoading(null);
  };

  const handleCopyEmail = async (sub: ContactSubmission) => {
    await navigator.clipboard.writeText(sub.email);
    setCopiedId(sub.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (submissions.length === 0) {
    return (
      <div className="py-20 text-center">
        <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No contact submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          <button
            onClick={() => setFilter("open")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "open"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Open
            {open.length > 0 && (
              <span className={`min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 ${
                unreadCount > 0 ? "bg-red-500" : "bg-muted-foreground"
              }`}>
                {open.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "resolved"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Resolved
            {resolved.length > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {resolved.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("archived")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "archived"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Archived
            {archived.length > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-muted-foreground text-white text-[10px] font-bold flex items-center justify-center px-1">
                {archived.length}
              </span>
            )}
          </button>
        </div>
        {unreadCount > 0 && filter === "open" && (
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {filter === "open"
            ? "All caught up — no open submissions."
            : filter === "resolved"
              ? "No resolved submissions yet."
              : "No archived submissions."}
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-[12px] overflow-hidden bg-white">
          {visible.map((sub) => {
            const isExpanded = expanded === sub.id;
            const isLoading = loading === sub.id;
            const isCopied = copiedId === sub.id;
            return (
              <div key={sub.id} className={sub.read ? "" : "bg-primary/[0.02]"}>
                <button
                  onClick={() => handleExpand(sub)}
                  className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative mt-0.5 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        {!sub.read && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm ${!sub.read ? "font-bold" : "font-semibold"} text-foreground`}>
                            {sub.name}
                          </span>
                          <span className="text-xs text-muted-foreground">{sub.email}</span>
                        </div>
                        <p className={`text-sm mt-0.5 truncate ${!sub.read ? "text-foreground font-medium" : "text-foreground/80"}`}>
                          {sub.subject}
                        </p>
                        {!isExpanded && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(sub.created_at), "MMM d, yyyy")}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-muted/20 border-t border-border">
                    <div className="ml-12 space-y-4">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {sub.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Copy email */}
                        <button
                          onClick={() => handleCopyEmail(sub)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title={`Copy ${sub.email}`}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {isCopied ? "Copied!" : "Copy Email"}
                        </button>

                        {/* Resolve / Reopen */}
                        {sub.resolved ? (
                          <button
                            onClick={() => handleReopen(sub)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {isLoading ? "Reopening..." : "Reopen"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResolve(sub)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {isLoading ? "Resolving..." : "Mark resolved"}
                          </button>
                        )}

                        {/* Archive / Unarchive */}
                        {sub.archived ? (
                          <button
                            onClick={() => handleUnarchive(sub)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" />
                            {isLoading ? "Restoring..." : "Unarchive"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(sub)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors disabled:opacity-50"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            {isLoading ? "Archiving..." : "Archive"}
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(sub)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Delete
                        </button>

                        <span className="text-xs text-muted-foreground ml-1">
                          {format(new Date(sub.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
