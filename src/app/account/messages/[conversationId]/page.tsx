"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";

type Conversation = {
  id: number;
  user_id: string;
  vendor_id: string;
  created_at: string;
};

type Message = {
  id: number;
  conversation_id: number;
  sender_type: "user" | "vendor";
  sender_id: string;
  message: string;
  created_at: string;
};

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default function UserConversationPage({ params }: Props) {
  const [conversationId, setConversationId] = useState<number>(0);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((resolved) => {
      setConversationId(Number(resolved.conversationId));
    });
  }, [params]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let timer: ReturnType<typeof setInterval> | null = null;

    async function fetchConversation() {
      try {
        const response = await fetch("/api/messages/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(
            String(payload?.error ?? "Failed to fetch conversation"),
          );
        }

        setConversation((payload?.conversation ?? null) as Conversation | null);
        setMessages((payload?.messages ?? []) as Message[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch conversation",
        );
      } finally {
        setLoading(false);
      }
    }

    async function loadUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(String(data?.user?.id ?? ""));
    }

    void loadUser();
    void fetchConversation();
    timer = setInterval(fetchConversation, 4000);

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [conversationId]);

  const canSend = useMemo(
    () =>
      Boolean(draft.trim()) &&
      Boolean(currentUserId) &&
      Boolean(conversationId),
    [draft, currentUserId, conversationId],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    setError(null);
    const message = draft.trim();

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          senderType: "user",
          senderId: currentUserId,
          message,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to send message"));
      }

      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Conversation</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading conversation...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      <div className="card space-y-3">
        <p className="text-lh-muted text-sm">
          Vendor: {conversation?.vendor_id ?? "-"}
        </p>
        <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
          {messages.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg p-3 text-sm ${item.sender_type === "user" ? "bg-lh-accent/10" : "bg-lh-surface-soft"}`}
            >
              <p className="text-lh-muted text-xs">{item.sender_type}</p>
              <p>{item.message}</p>
              <p className="text-lh-muted text-xs">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="border-lh-border w-full rounded-lg border px-3 py-2"
            placeholder="Type your message"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
