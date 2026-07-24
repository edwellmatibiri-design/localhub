"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/db";

type ChatRow = {
  sender: "vendor" | "ai";
  message: string;
};

const VENDOR_PROMPTS = [
  "Help me respond to this lead",
  "Help me write a quote",
  "Help me follow up",
  "Help me handle a dispute",
  "Help me improve my profile",
  "Help me improve my response rate",
];

export default function VendorAiAssistantPage() {
  const searchParams = useSearchParams();
  const initialPrompt = String(searchParams.get("prompt") ?? "").trim();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [vendorId, setVendorId] = useState<string>("");
  const [input, setInput] = useState(initialPrompt);
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Would you like me to follow up?",
    "Would you like me to write a quote?",
    "Would you like me to respond to this lead?",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVendorId() {
      try {
        const supabase = createClient();
        const fromQuery = String(
          new URLSearchParams(window.location.search).get("vendorId") ?? "",
        ).trim();
        if (fromQuery) {
          setVendorId(fromQuery);
          return;
        }

        const { data } = await supabase
          .from("seller_profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setVendorId(String(data?.id ?? ""));
      } catch {
        setVendorId("");
      }
    }

    void loadVendorId();
  }, []);

  useEffect(() => {
    if (!initialPrompt) return;
    setInput(initialPrompt);
  }, [initialPrompt]);

  const canSend = useMemo(
    () => !loading && input.trim().length > 0,
    [input, loading],
  );

  async function sendMessage(nextMessage?: string) {
    const text = String(nextMessage ?? input).trim();
    if (!text || loading) return;

    setLoading(true);
    setError(null);
    setMessages((current) => [...current, { sender: "vendor", message: text }]);
    if (!nextMessage) setInput("");

    try {
      const response = await fetch("/api/ai/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          role: "vendor",
          vendorId,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to send message"));
      }

      setSessionId(Number(payload.sessionId));
      setMessages((current) => [
        ...current,
        { sender: "ai", message: String(payload.reply ?? "") },
      ]);
      setSuggestions((payload.suggestions ?? []) as string[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor AI Assistant</h1>
      <p className="text-lh-muted text-sm">
        Draft quotes, lead responses, follow-ups, and dispute replies with
        CRM-friendly guidance.
      </p>

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold">Vendor tools</h2>
        <div className="flex flex-wrap gap-2">
          {VENDOR_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              className="border-lh-border rounded-lg border px-3 py-1 text-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <div className="border-lh-border h-80 overflow-y-auto rounded border p-3">
          {messages.length === 0 ? (
            <p className="text-lh-muted text-sm">
              Start by asking for help on a lead, quote, or dispute.
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((row, index) => (
                <div
                  key={`${row.sender}-${index}`}
                  className={`rounded p-2 text-sm ${row.sender === "vendor" ? "bg-lh-accent/10" : "text-lh-on-accent"}`}
                >
                  <p className="text-lh-muted text-xs uppercase">
                    {row.sender}
                  </p>
                  <p className="whitespace-pre-wrap">{row.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for a quote draft, follow-up message, or CRM reply"
            className="border-lh-border min-h-20 w-full rounded-lg border px-3 py-2"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!canSend}
              className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
            {sessionId && (
              <span className="text-lh-muted text-xs">
                Session #{sessionId}
              </span>
            )}
          </div>
        </div>

        {error && <p className="text-lh-danger text-sm">{error}</p>}
      </section>

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold">Smart suggestions</h2>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendMessage(suggestion)}
              className="border-lh-border rounded-lg border px-3 py-1 text-xs"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
