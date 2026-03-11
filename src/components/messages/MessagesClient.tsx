"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, isToday, isYesterday } from "date-fns";
import {
  ArrowLeft,
  Send,
  Inbox,
  MessageCircle,
  Search,
  Trash2,
  HelpCircle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessage,
  markMessagesRead,
  deleteMessage,
  deleteConversationForMe,
  deleteConversationForEveryone,
} from "@/lib/actions/messages";
import type { Message, Conversation, UserProfile } from "@/types/message";

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

function Avatar({
  name,
  photo,
  size = "md",
}: {
  name: string;
  photo?: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${dim} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0`}>
      {photo ? (
        <Image src={photo} alt="" width={40} height={40} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function buildConversations(messages: Message[], currentUserId: string): Conversation[] {
  const convMap = new Map<string, Message[]>();
  for (const msg of messages) {
    const otherId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;
    if (!convMap.has(otherId)) convMap.set(otherId, []);
    convMap.get(otherId)!.push(msg);
  }

  const result: Conversation[] = [];
  for (const [otherId, msgs] of convMap) {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const lastMsg = sorted[sorted.length - 1];

    // Find the best name/photo for the other user
    let name = "Unknown User";
    let photo: string | null = null;
    for (const m of sorted) {
      if (m.sender_id === otherId && m.sender_name) {
        name = m.sender_name;
        photo = m.sender_photo;
        break;
      }
      if (m.recipient_id === otherId && m.recipient_name) {
        name = m.recipient_name;
        photo = m.recipient_photo;
        break;
      }
    }

    result.push({
      otherUserId: otherId,
      otherUserName: name,
      otherUserPhoto: photo,
      lastMessage: lastMsg,
      unreadCount: sorted.filter((m) => m.recipient_id === currentUserId && !m.read).length,
      messages: sorted,
    });
  }

  return result.sort(
    (a, b) =>
      new Date(b.lastMessage.created_at).getTime() -
      new Date(a.lastMessage.created_at).getTime()
  );
}

interface MessagesClientProps {
  initialMessages: Message[];
  currentUserId: string;
  toUser?: UserProfile | null;
  adminUsers?: UserProfile[];
}

export default function MessagesClient({
  initialMessages,
  currentUserId,
  toUser,
  adminUsers = [],
}: MessagesClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState<UserProfile | null>(toUser ?? null);
  const [composing, setComposing] = useState(!!toUser);
  const [messageText, setMessageText] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [supportMode, setSupportMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "message"; id: string } | { type: "conversation"; userId: string; name: string } | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const conversations = buildConversations(messages, currentUserId);
  const totalUnread = messages.filter((m) => m.recipient_id === currentUserId && !m.read).length;

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.otherUserName.toLowerCase().includes(q) ||
      c.messages.some(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q)
      )
    );
  });

  const activeConversation = conversations.find((c) => c.otherUserId === selectedUserId);

  // Auto-select first conversation or handle ?to= param
  useEffect(() => {
    if (toUser) {
      const existing = conversations.find((c) => c.otherUserId === toUser.id);
      if (existing) {
        setSelectedUserId(toUser.id);
        setComposing(false);
        setComposeTo(null);
      } else {
        setComposing(true);
        setComposeTo(toUser);
        setSelectedUserId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toUser?.id]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("messages-realtime-client")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Record<string, unknown>;
          // Fetch sender profile
          const { data: profiles } = await supabase.rpc("get_public_profiles", {
            profile_ids: [newMsg.sender_id as string],
          });
          const profile = (profiles as Record<string, unknown>[])?.[0];
          const enriched: Message = {
            id: newMsg.id as string,
            sender_id: newMsg.sender_id as string,
            recipient_id: newMsg.recipient_id as string,
            retreat_id: newMsg.retreat_id as string | null,
            subject: newMsg.subject as string,
            body: newMsg.body as string,
            message_type: (newMsg.message_type as string) || "general",
            read: false,
            created_at: newMsg.created_at as string,
            sender_name: profile ? (profile.name as string) || null : null,
            sender_photo: profile ? (profile.profile_photo as string) || null : null,
            recipient_name: null,
            recipient_photo: null,
          };
          setMessages((prev) => {
            if (prev.find((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });

          // Auto-mark as read if conversation is open
          if (newMsg.sender_id === selectedUserId) {
            await markMessagesRead([enriched.id]);
            setMessages((prev) =>
              prev.map((m) => (m.id === enriched.id ? { ...m, read: true } : m))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, read: updated.read as boolean } : m))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const deleted = payload.old as Record<string, unknown>;
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUserId]);

  // Scroll to bottom when thread changes
  useEffect(() => {
    if (activeConversation && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeConversation?.messages.length, selectedUserId]);

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedUserId(conv.otherUserId);
    setComposing(false);
    setComposeTo(null);
    setMessageText("");

    const unreadIds = conv.messages
      .filter((m) => m.recipient_id === currentUserId && !m.read)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await markMessagesRead(unreadIds);
      setMessages((prev) =>
        prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m))
      );
    }
  };

  const handleSendInThread = async () => {
    if (!selectedUserId || !messageText.trim() || sending) return;
    setSending(true);

    const conv = activeConversation;
    const subject = conv?.messages[0]?.subject || "Message";

    const result = await sendMessage(selectedUserId, subject, messageText.trim(), "general");
    setSending(false);

    if ("error" in result) return;

    // Optimistic: add sent message to state
    const optimistic: Message = {
      id: result.id,
      sender_id: currentUserId,
      recipient_id: selectedUserId,
      retreat_id: null,
      subject,
      body: messageText.trim(),
      message_type: "general",
      read: false,
      created_at: new Date().toISOString(),
      sender_name: null,
      sender_photo: null,
      recipient_name: conv?.otherUserName || null,
      recipient_photo: conv?.otherUserPhoto || null,
    };
    setMessages((prev) => {
      if (prev.find((m) => m.id === optimistic.id)) return prev;
      return [...prev, optimistic];
    });
    setMessageText("");
  };

  const handleSendNewMessage = async () => {
    if (!composeTo || !composeBody.trim() || sending) return;
    setSending(true);

    if (supportMode) {
      // Broadcast to all admins
      const results = await Promise.all(
        adminUsers.map((admin) =>
          sendMessage(admin.id, "Support request", composeBody.trim(), "general")
        )
      );
      setSending(false);
      const firstSuccess = results.find((r) => !("error" in r)) as { id: string } | undefined;
      if (!firstSuccess) return;

      // Optimistic: add one message per admin to local state
      const now = new Date().toISOString();
      const optimistics: Message[] = adminUsers.map((admin, i) => ({
        id: (results[i] as { id: string }).id ?? `opt-${admin.id}`,
        sender_id: currentUserId,
        recipient_id: admin.id,
        retreat_id: null,
        subject: "Support request",
        body: composeBody.trim(),
        message_type: "general",
        read: false,
        created_at: now,
        sender_name: null,
        sender_photo: null,
        recipient_name: admin.name,
        recipient_photo: admin.profile_photo,
      }));
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        return [...prev, ...optimistics.filter((m) => !existingIds.has(m.id))];
      });

      setSupportMode(false);
      setComposing(false);
      setComposeTo(null);
      setComposeBody("");
      // Open conversation with first admin
      setSelectedUserId(adminUsers[0].id);
      return;
    }

    const result = await sendMessage(composeTo.id, "New conversation", composeBody.trim(), "general");
    setSending(false);

    if ("error" in result) return;

    const optimistic: Message = {
      id: result.id,
      sender_id: currentUserId,
      recipient_id: composeTo.id,
      retreat_id: null,
      subject: "New conversation",
      body: composeBody.trim(),
      message_type: "general",
      read: false,
      created_at: new Date().toISOString(),
      sender_name: null,
      sender_photo: null,
      recipient_name: composeTo.name,
      recipient_photo: composeTo.profile_photo,
    };
    setMessages((prev) => {
      if (prev.find((m) => m.id === optimistic.id)) return prev;
      return [...prev, optimistic];
    });

    setComposing(false);
    setComposeTo(null);
    setComposeBody("");
    setSelectedUserId(composeTo.id);
  };

  const handleContactSupport = () => {
    if (!adminUsers.length) return;
    // If already has a conversation with any admin, open the most recent one
    const existingWithAdmin = conversations.find((c) =>
      adminUsers.some((a) => a.id === c.otherUserId)
    );
    if (existingWithAdmin) {
      handleSelectConversation(existingWithAdmin);
    } else {
      setSupportMode(true);
      setComposing(true);
      setComposeTo({ id: "", name: "Support Team", profile_photo: null });
      setSelectedUserId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "message") {
      await deleteMessage(deleteTarget.id);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    } else if (deleteTarget.type === "conversation") {
      // Default to "for me" soft-delete
      await deleteConversationForMe(deleteTarget.userId);
      setMessages((prev) =>
        prev.filter(
          (m) =>
            !(
              (m.sender_id === currentUserId && m.recipient_id === deleteTarget.userId) ||
              (m.sender_id === deleteTarget.userId && m.recipient_id === currentUserId)
            )
        )
      );
      if (selectedUserId === deleteTarget.userId) setSelectedUserId(null);
    }
    setDeleteTarget(null);
  };

  const confirmDeleteEveryone = async () => {
    if (!deleteTarget || deleteTarget.type !== "conversation") return;
    await deleteConversationForEveryone(deleteTarget.userId);
    setMessages((prev) =>
      prev.filter(
        (m) =>
          !(
            (m.sender_id === currentUserId && m.recipient_id === deleteTarget.userId) ||
            (m.sender_id === deleteTarget.userId && m.recipient_id === currentUserId)
          )
      )
    );
    if (selectedUserId === deleteTarget.userId) setSelectedUserId(null);
    setDeleteTarget(null);
  };

  const showThread = !composing && !!activeConversation;
  const showCompose = composing && !!composeTo;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)", marginTop: "64px" }}>
      {/* Page Header */}
      <header className="bg-white border-b border-border px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1 flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">Messages</h1>
          {totalUnread > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </div>
        {adminUsers.length > 0 && (
          <button
            onClick={handleContactSupport}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Contact Support
          </button>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Conversation List */}
        <div
          className={`w-full sm:w-80 border-r border-border flex flex-col shrink-0 ${
            (showThread || showCompose) ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery.trim() ? "No conversations match your search" : "No conversations yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conv) => {
                  const isActive = selectedUserId === conv.otherUserId;
                  const isLastFromMe = conv.lastMessage.sender_id === currentUserId;
                  const preview = isLastFromMe
                    ? `You: ${conv.lastMessage.body}`
                    : conv.lastMessage.body;

                  return (
                    <button
                      key={conv.otherUserId}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 text-left transition-colors hover:bg-muted/40 ${
                        isActive ? "bg-primary/5 border-l-2 border-primary" : ""
                      } ${conv.unreadCount > 0 && !isActive ? "bg-primary/3" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={conv.otherUserName} photo={conv.otherUserPhoto} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`text-sm truncate ${conv.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                              {conv.otherUserName}
                            </span>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {formatMessageTime(conv.lastMessage.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate flex-1 ${conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                              {preview}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Thread / Compose / Empty */}
        <div
          className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${
            !showThread && !showCompose ? "hidden sm:flex" : "flex"
          }`}
        >
          {showCompose ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => { setComposing(false); setComposeTo(null); setSupportMode(false); }}
                  className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Avatar name={composeTo!.name || "U"} photo={composeTo!.profile_photo} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {supportMode ? "Contact Support Team" : `New message to ${composeTo!.name || "User"}`}
                  </p>
                  {supportMode && (
                    <p className="text-xs text-muted-foreground">
                      Your message will be sent to all {adminUsers.length} admin{adminUsers.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setComposing(false); setComposeTo(null); setSupportMode(false); }}
                  className="hidden sm:flex text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Start a conversation with {composeTo!.name || "this user"}
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <textarea
                    placeholder="Write a message..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={2}
                    autoFocus
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendNewMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendNewMessage}
                    disabled={!composeBody.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : showThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Avatar name={activeConversation!.otherUserName} photo={activeConversation!.otherUserPhoto} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activeConversation!.otherUserName}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeConversation!.messages.length} message{activeConversation!.messages.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setDeleteTarget({
                      type: "conversation",
                      userId: activeConversation!.otherUserId,
                      name: activeConversation!.otherUserName,
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {activeConversation!.messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}>
                      <Avatar
                        size="sm"
                        name={isMe ? "Me" : activeConversation!.otherUserName}
                        photo={isMe ? null : activeConversation!.otherUserPhoto}
                      />
                      <div className={`max-w-[70%] space-y-1 ${isMe ? "items-end" : ""}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          }`}
                        >
                          {msg.body}
                        </div>
                        <div className={`flex items-center gap-2 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(msg.created_at), "h:mm a")}
                          </span>
                          {isMe && (
                            <button
                              onClick={() => setDeleteTarget({ type: "message", id: msg.id })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border shrink-0">
                <div className="flex gap-2">
                  <textarea
                    placeholder="Write a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={2}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendInThread();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendInThread}
                    disabled={!messageText.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground text-sm">Select a conversation to view</p>
                {adminUsers.length > 0 && (
                  <button
                    onClick={handleContactSupport}
                    className="mt-4 sm:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Contact Support
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-sm p-6">
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {deleteTarget.type === "message" ? (
              <>
                <h3 className="text-base font-semibold mb-2">Delete message?</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  This will permanently delete this message for both you and the other person.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-full transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold mb-2">
                  Delete conversation with {deleteTarget.name}?
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Choose how you&apos;d like to delete this conversation.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2.5 text-sm font-semibold bg-muted text-foreground hover:bg-muted/80 rounded-full transition-colors"
                  >
                    Delete for me only
                  </button>
                  <button
                    onClick={confirmDeleteEveryone}
                    className="px-4 py-2.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-full transition-colors"
                  >
                    Delete for everyone
                  </button>
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
