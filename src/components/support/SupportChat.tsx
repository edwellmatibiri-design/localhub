"use client";

import { useState } from "react";
import { SupportBubble } from "./SupportBubble";

type ChatMessage = {
  from: "user" | "bot";
  text: string;
  steps?: string[];
  tutorial?: string[] | null;
  troubleshooting?: string[] | null;
  escalation?: {
    ticketId: string;
  } | null;
};

export function SupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);

    const res = await fetch("/api/support/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed, userId: "demo-user" }),
    });

    const data = await res.json();

    const botMessage: ChatMessage = {
      from: "bot",
      text: data.response?.reply ?? "I could not generate a response.",
      steps: data.response?.steps,
      tutorial: data.tutorial,
      troubleshooting: data.troubleshooting,
      escalation: data.escalation,
    };

    setMessages((prev) => [...prev, botMessage]);
    setInput("");
  }

  return (
    <div className="border-lh-border bg-lh-surface shadow-lh-soft flex min-h-[500px] flex-col rounded-2xl border">
      <div className="border-lh-border flex items-center justify-between border-b px-5 pt-4 pb-3">
        <div>
          <p className="text-lh-text-primary text-sm font-semibold">
            LocalHub Marketplace Help and Support
          </p>
          <p className="text-lh-text-secondary text-xs">
            Ask anything about bookings, vendors, payouts, or your account.
          </p>
        </div>
        <div className="border-lh-border bg-lh-surface-soft text-lh-text-secondary rounded-full border px-2 py-1 text-xs">
          AI Assistant - Online
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((msg, i) => (
          <SupportBubble key={i} msg={msg} />
        ))}
        {messages.length === 0 && (
          <div className="text-lh-text-secondary text-xs">
            Try: "I cannot accept a booking" or "Show me how to send a quote".
          </div>
        )}
      </div>

      <div className="border-lh-border flex items-center gap-3 border-t px-5 py-4">
        <input
          className="border-lh-border bg-lh-surface-soft text-lh-text-primary placeholder:text-lh-text-secondary focus:ring-lh-accent flex-1 rounded-2xl border px-4 py-2 text-sm focus:ring-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your issue or ask a question..."
        />
        <button
          onClick={sendMessage}
          className="bg-lh-accent text-lh-on-accent hover:bg-lh-accent-soft rounded-2xl px-4 py-2 text-sm font-medium transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
