"use client";

import { useEffect, useMemo, useState } from "react";

type SessionRow = {
  id: number;
  role: "user" | "vendor";
  user_id: string | null;
  vendor_id: string | null;
  context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type LogRow = {
  id: number;
  session_id: number;
  sender: "user" | "vendor" | "ai";
  message: string;
  created_at: string;
};

type Metrics = {
  totalSessions: number;
  userUsage: number;
  vendorUsage: number;
  topIntents: Array<{ intent: string; count: number }>;
  conversionUplift: number;
  bookingUplift: number;
};

export default function AdminAiPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/admin", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to load AI analytics"),
        );
      }

      setMetrics(payload.metrics as Metrics);
      setSessions((payload.sessions ?? []) as SessionRow[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load AI analytics",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  async function inspectSession(sessionId: number) {
    setSelectedSession(sessionId);
    try {
      const response = await fetch(`/api/ai/admin?sessionId=${sessionId}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to inspect session"));
      }

      setLogs((payload.logs ?? []) as LogRow[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to inspect session",
      );
    }
  }

  async function resetSession(sessionId: number) {
    try {
      const response = await fetch("/api/ai/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_session", sessionId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to reset session"));
      }

      if (selectedSession === sessionId) {
        setLogs([]);
      }
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset session");
    }
  }

  const upliftSummary = useMemo(() => {
    if (!metrics) return "-";
    return `${(metrics.conversionUplift * 100).toFixed(2)}% conversion uplift | ${metrics.bookingUplift.toFixed(2)} bookings/user uplift`;
  }, [metrics]);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">AI Intelligence</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading AI analytics...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {metrics && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="card">
              <p className="text-lh-muted text-xs">Total AI sessions</p>
              <p className="text-xl font-semibold">{metrics.totalSessions}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">User usage</p>
              <p className="text-xl font-semibold">{metrics.userUsage}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Vendor usage</p>
              <p className="text-xl font-semibold">{metrics.vendorUsage}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Conversion uplift from AI</p>
              <p className="text-xl font-semibold">
                {(metrics.conversionUplift * 100).toFixed(2)}%
              </p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Booking uplift from AI</p>
              <p className="text-xl font-semibold">
                {metrics.bookingUplift.toFixed(2)}
              </p>
            </div>
          </div>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Top intents</h2>
            {metrics.topIntents.length === 0 ? (
              <p className="text-lh-muted text-sm">No intent data yet.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {metrics.topIntents.map((intent) => (
                  <p key={intent.intent} className="text-sm">
                    {intent.intent}: {intent.count}
                  </p>
                ))}
              </div>
            )}
            <p className="text-lh-muted text-xs">{upliftSummary}</p>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Session logs</h2>
              {sessions.length === 0 ? (
                <p className="text-lh-muted text-sm">No sessions found.</p>
              ) : (
                sessions.map((session) => (
                  <article
                    key={session.id}
                    className="border-lh-border space-y-1 rounded border p-2 text-sm"
                  >
                    <p>
                      <span className="font-medium">Session:</span> #
                      {session.id}
                    </p>
                    <p>
                      <span className="font-medium">Role:</span> {session.role}
                    </p>
                    <p className="text-lh-muted">
                      Updated: {new Date(session.updated_at).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void inspectSession(session.id)}
                        className="border-lh-border rounded border px-2 py-1 text-xs"
                      >
                        Inspect session logs
                      </button>
                      <button
                        type="button"
                        onClick={() => void resetSession(session.id)}
                        className="border-lh-danger text-lh-danger rounded border px-2 py-1 text-xs"
                      >
                        Reset session
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Selected log details</h2>
              {!selectedSession ? (
                <p className="text-lh-muted text-sm">
                  Pick a session to inspect logs.
                </p>
              ) : logs.length === 0 ? (
                <p className="text-lh-muted text-sm">
                  No messages in this session.
                </p>
              ) : (
                logs.map((log) => (
                  <article
                    key={log.id}
                    className="border-lh-border rounded border p-2 text-sm"
                  >
                    <p className="text-lh-muted text-xs uppercase">
                      {log.sender}
                    </p>
                    <p className="whitespace-pre-wrap">{log.message}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
