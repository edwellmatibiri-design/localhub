"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type ConversationRow = {
  id: number;
  user_id: string;
  vendor_id: string;
  created_at: string;
};

type MessageRow = {
  id: number;
  conversation_id: number;
  message: string;
  created_at: string;
};

export default function VendorInboxPage() {
  const [rows, setRows] = useState<
    Array<{ conversation: ConversationRow; lastMessage: MessageRow | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInbox() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const searchVendorId =
          new URLSearchParams(window.location.search).get("vendorId") ?? "";
        let vendorId = searchVendorId;

        if (!vendorId) {
          const { data: vendor } = await supabase
            .from("seller_profiles")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          vendorId = String(vendor?.id ?? "");
        }

        if (!vendorId) {
          setRows([]);
          return;
        }

        const { data: conversations, error: conversationError } = await supabase
          .from("conversations")
          .select("id, user_id, vendor_id, created_at")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false });

        if (conversationError) {
          throw conversationError;
        }

        const convoRows = (conversations ?? []) as ConversationRow[];
        if (convoRows.length === 0) {
          setRows([]);
          return;
        }

        const conversationIds = convoRows.map((row) => row.id);
        const { data: messages, error: messageError } = await supabase
          .from("messages")
          .select("id, conversation_id, message, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        if (messageError) {
          throw messageError;
        }

        const lastByConversation = new Map<number, MessageRow>();
        ((messages ?? []) as MessageRow[]).forEach((message) => {
          if (!lastByConversation.has(message.conversation_id)) {
            lastByConversation.set(message.conversation_id, message);
          }
        });

        setRows(
          convoRows.map((conversation) => ({
            conversation,
            lastMessage: lastByConversation.get(conversation.id) ?? null,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load inbox");
      } finally {
        setLoading(false);
      }
    }

    loadInbox();
  }, []);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Messages</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading conversations...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && rows.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No conversations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Link
              key={row.conversation.id}
              href={`/vendors/dashboard/messages/${row.conversation.id}`}
              className="card block space-y-1"
            >
              <p className="font-medium">User: {row.conversation.user_id}</p>
              <p className="text-lh-muted text-sm">
                {row.lastMessage?.message ?? "No messages yet"}
              </p>
              <p className="text-lh-muted text-xs">
                {new Date(
                  row.lastMessage?.created_at ?? row.conversation.created_at,
                ).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
