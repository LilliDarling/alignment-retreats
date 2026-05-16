"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  retreat_id: string | null;
  read: boolean;
  created_at: string;
};

const RECENT_LIMIT = 15;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const fetchAll = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("notifications")
        .select("id, type, title, body, action_url, retreat_id, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT);
      const rows = (data as Notification[] | null) ?? [];
      setNotifications(rows);
      setUnreadCount(rows.filter((n) => !n.read).length);
    };

    fetchAll();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
        },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, unreadCount };
}
