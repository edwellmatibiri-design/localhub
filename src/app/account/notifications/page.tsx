"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type NotificationRow = {
  id: number;
  user_id: string | null;
  vendor_id: string | null;
  type: string;
  message: string;
  created_at: string;
  read: boolean;
};

function extractConversationId(message: string) {
  const match = message.match(/conversation\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function extractBookingId(message: string) {
  const match = message.match(/booking\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

export default function UserNotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const userId = String(auth?.user?.id ?? "");

        if (!userId) {
          setItems([]);
          return;
        }

        const { data, error: notificationError } = await supabase
          .from("notifications")
          .select("id, user_id, vendor_id, type, message, created_at, read")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (notificationError) {
          throw notificationError;
        }

        setItems((data ?? []) as NotificationRow[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load notifications",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function markRead(notificationId: number) {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to mark as read"));
      }

      setItems((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as read");
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading notifications...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && items.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const conversationId = extractConversationId(item.message);
            const bookingId = extractBookingId(item.message);
            return (
              <article key={item.id} className="card space-y-2">
                <p className="text-sm font-medium">{item.type}</p>
                <p className="text-lh-muted text-sm">{item.message}</p>
                <p className="text-lh-muted text-xs">
                  {new Date(item.created_at).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                    >
                      Mark as read
                    </button>
                  )}
                  {conversationId && (
                    <Link
                      href={`/account/messages/${conversationId}`}
                      className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-1 text-sm"
                    >
                      Open conversation
                    </Link>
                  )}
                  {bookingId && (
                    <Link
                      href="/account/bookings"
                      className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                    >
                      View booking
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
