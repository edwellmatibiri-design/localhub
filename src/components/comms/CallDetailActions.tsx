"use client";

import { useState } from "react";

type CallDetailActionsProps = {
  callId: number;
  vendorId: string;
  userId: string;
  staffId?: number | null;
  leadId?: number | null;
};

export function CallBackButton({
  vendorId,
  userId,
  staffId,
  leadId,
  label = "Call back",
}: {
  vendorId: string;
  userId: string;
  staffId?: number | null;
  leadId?: number | null;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, userId, staffId, leadId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to initiate callback"),
        );
      }
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initiate callback",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Calling..." : label}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}

export default function CallDetailActions({
  callId,
  vendorId,
  userId,
  staffId,
  leadId,
}: CallDetailActionsProps) {
  const [whatsAppMessage, setWhatsAppMessage] = useState(
    "Hi, following up on your recent call. How can we help?",
  );
  const [crmNote, setCrmNote] = useState(`Follow-up after call #${callId}.`);
  const [loadingAction, setLoadingAction] = useState<
    "whatsapp" | "note" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function sendWhatsApp() {
    setLoadingAction("whatsapp");
    setError(null);
    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          userId,
          leadId,
          message: whatsAppMessage,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to send WhatsApp message"),
        );
      }
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send WhatsApp message",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function addCrmNote() {
    setLoadingAction("note");
    setError(null);
    try {
      const response = await fetch("/api/crm/notes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, userId, leadId, note: crmNote }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to add CRM note"));
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add CRM note");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <CallBackButton
          vendorId={vendorId}
          userId={userId}
          staffId={staffId}
          leadId={leadId}
        />
      </div>

      <div className="space-y-1">
        <label className="text-lh-muted text-xs" htmlFor="wa-message">
          Send WhatsApp message
        </label>
        <textarea
          id="wa-message"
          className="border-lh-border w-full rounded border px-3 py-2 text-sm"
          rows={3}
          value={whatsAppMessage}
          onChange={(event) => setWhatsAppMessage(event.target.value)}
        />
        <button
          type="button"
          onClick={() => void sendWhatsApp()}
          disabled={loadingAction !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loadingAction === "whatsapp"
            ? "Sending..."
            : "Send WhatsApp message"}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-lh-muted text-xs" htmlFor="crm-note">
          Add CRM note
        </label>
        <textarea
          id="crm-note"
          className="border-lh-border w-full rounded border px-3 py-2 text-sm"
          rows={3}
          value={crmNote}
          onChange={(event) => setCrmNote(event.target.value)}
        />
        <button
          type="button"
          onClick={() => void addCrmNote()}
          disabled={loadingAction !== null}
          className="border-lh-border rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loadingAction === "note" ? "Saving..." : "Add CRM note"}
        </button>
      </div>

      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </div>
  );
}
