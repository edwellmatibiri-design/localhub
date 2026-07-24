"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type LeadRow = {
  id: number;
  user_id: string;
  vendor_id: string;
  message: string | null;
  status: "sent" | "accepted" | "ignored" | "expired";
  created_at: string;
};

type SmartLeadPayload = {
  summary?: {
    job_description?: string;
    job_size?: string;
    complexity?: string;
    estimated_duration?: number;
    instant_quote_range?: { min?: number; max?: number };
    photos?: string[];
    user_notes?: string;
  };
  scope?: {
    job_size?: string;
    job_complexity?: string;
    estimated_duration?: number;
    estimated_team_size?: number;
  };
  quote?: {
    price_range_min?: number;
    price_range_max?: number;
  };
};

function parseSmartPayload(message: string | null) {
  const text = String(message ?? "");
  const marker = "SMART_BOOKING::";
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0)
    return { plainMessage: text, payload: null as SmartLeadPayload | null };

  const plainMessage = text.slice(0, markerIndex).trim();
  const raw = text.slice(markerIndex + marker.length).trim();

  try {
    return { plainMessage, payload: JSON.parse(raw) as SmartLeadPayload };
  } catch {
    return { plainMessage: text, payload: null as SmartLeadPayload | null };
  }
}

type UserTrustRow = {
  user_id: string;
  trust_score: number;
  phone_verified: boolean;
  email_verified: boolean;
};

type UserReputationRow = {
  user_id: string;
  reputation_score: number;
  completed_bookings: number;
  cancelled_bookings: number;
  on_time_payments: number;
  late_payments: number;
};

export default function VendorLeadsPage() {
  const [vendorId, setVendorId] = useState("");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [trustByUserId, setTrustByUserId] = useState<
    Record<string, UserTrustRow>
  >({});
  const [reputationByUserId, setReputationByUserId] = useState<
    Record<string, UserReputationRow>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteDraftByLeadId, setQuoteDraftByLeadId] = useState<
    Record<number, string>
  >({});
  const [infoRequestByLeadId, setInfoRequestByLeadId] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    async function loadLeads() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const queryVendorId =
          new URLSearchParams(window.location.search).get("vendorId") ?? "";

        let activeVendorId = queryVendorId;
        if (!activeVendorId) {
          const { data: profile } = await supabase
            .from("seller_profiles")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          activeVendorId = String(profile?.id ?? "");
        }

        setVendorId(activeVendorId);
        if (!activeVendorId) {
          setLeads([]);
          return;
        }

        const { data: leadRows, error: leadsError } = await supabase
          .from("leads")
          .select("id, user_id, vendor_id, message, status, created_at")
          .eq("vendor_id", activeVendorId)
          .order("created_at", { ascending: false });

        if (leadsError) {
          throw leadsError;
        }

        setLeads((leadRows ?? []) as LeadRow[]);

        const userIds = Array.from(
          new Set(
            (leadRows ?? [])
              .map((lead) => String(lead.user_id))
              .filter(Boolean),
          ),
        );
        if (userIds.length > 0) {
          const { data: trustRows } = await supabase
            .from("user_trust_profile")
            .select("user_id, trust_score, phone_verified, email_verified")
            .in("user_id", userIds);

          const { data: reputationRows } = await supabase
            .from("user_reputation")
            .select(
              "user_id, reputation_score, completed_bookings, cancelled_bookings, on_time_payments, late_payments",
            )
            .in("user_id", userIds);

          const trustMap: Record<string, UserTrustRow> = {};
          (trustRows ?? []).forEach((row) => {
            trustMap[String(row.user_id)] = {
              user_id: String(row.user_id),
              trust_score: Number(row.trust_score ?? 50),
              phone_verified: Boolean(row.phone_verified),
              email_verified: Boolean(row.email_verified),
            };
          });
          setTrustByUserId(trustMap);

          const reputationMap: Record<string, UserReputationRow> = {};
          (reputationRows ?? []).forEach((row) => {
            reputationMap[String(row.user_id)] = {
              user_id: String(row.user_id),
              reputation_score: Number(row.reputation_score ?? 50),
              completed_bookings: Number(row.completed_bookings ?? 0),
              cancelled_bookings: Number(row.cancelled_bookings ?? 0),
              on_time_payments: Number(row.on_time_payments ?? 0),
              late_payments: Number(row.late_payments ?? 0),
            };
          });
          setReputationByUserId(reputationMap);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leads");
      } finally {
        setLoading(false);
      }
    }

    void loadLeads();
  }, []);

  async function acceptLead(leadId: number) {
    setError(null);
    try {
      const response = await fetch("/api/leads/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to accept lead"));
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId ? { ...lead, status: "accepted" } : lead,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept lead");
    }
  }

  async function ignoreLead(leadId: number) {
    setError(null);
    try {
      const response = await fetch("/api/leads/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: "ignored" }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to ignore lead"));
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId ? { ...lead, status: "ignored" } : lead,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ignore lead");
    }
  }

  async function sendCustomQuote(lead: LeadRow) {
    setError(null);
    const quoteMessage = String(quoteDraftByLeadId[lead.id] ?? "").trim();
    if (!quoteMessage) {
      setError("Enter a custom quote message first.");
      return;
    }

    try {
      const response = await fetch("/api/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: lead.vendor_id,
          userId: lead.user_id,
          leadId: lead.id,
          message: quoteMessage,
          preferredDate: new Date().toISOString(),
          valueEstimate: 0,
          probability: 55,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to send custom quote"),
        );
      }

      setQuoteDraftByLeadId((current) => ({ ...current, [lead.id]: "" }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send custom quote",
      );
    }
  }

  async function requestMoreInfo(lead: LeadRow) {
    setError(null);
    const note = String(infoRequestByLeadId[lead.id] ?? "").trim();
    if (!note) {
      setError("Enter a message requesting more info.");
      return;
    }

    try {
      const response = await fetch("/api/leads/request-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          vendorId: lead.vendor_id,
          note,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to request more info"),
        );
      }

      setInfoRequestByLeadId((current) => ({ ...current, [lead.id]: "" }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to request more info",
      );
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Lead Inbox</h1>
      <p className="text-lh-muted text-sm">
        Vendor: {vendorId || "Not selected"}
      </p>

      {loading && (
        <p className="card text-lh-muted text-sm">Loading leads...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && leads.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No incoming leads.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <article key={lead.id} className="card space-y-2">
              {(() => {
                const parsed = parseSmartPayload(lead.message);
                const smart = parsed.payload;
                return (
                  <>
                    {smart?.summary?.instant_quote_range && (
                      <p className="text-lh-emerald text-sm">
                        Instant quote: R{" "}
                        {Number(
                          smart.summary.instant_quote_range.min ??
                            smart.quote?.price_range_min ??
                            0,
                        )}{" "}
                        - R{" "}
                        {Number(
                          smart.summary.instant_quote_range.max ??
                            smart.quote?.price_range_max ??
                            0,
                        )}
                      </p>
                    )}
                    {smart?.summary?.job_size && (
                      <p className="text-lh-muted text-xs">
                        Job size: {smart.summary.job_size} | Complexity:{" "}
                        {smart.summary.complexity ??
                          smart.scope?.job_complexity ??
                          "-"}{" "}
                        | Duration:{" "}
                        {Number(
                          smart.summary.estimated_duration ??
                            smart.scope?.estimated_duration ??
                            0,
                        )}
                        h
                      </p>
                    )}
                    {Array.isArray(smart?.summary?.photos) &&
                      smart.summary.photos.length > 0 && (
                        <p className="text-lh-muted text-xs">
                          Photos attached: {smart.summary.photos.length}
                        </p>
                      )}
                    <p className="text-lh-muted text-sm">
                      Message: {parsed.plainMessage || "-"}
                    </p>
                  </>
                );
              })()}
              {Number(trustByUserId[lead.user_id]?.trust_score ?? 50) < 20 && (
                <p className="text-lh-on-accent text-sm">Low Trust User</p>
              )}
              {Number(
                reputationByUserId[lead.user_id]?.reputation_score ?? 50,
              ) <= 20 && (
                <p className="text-lh-on-accent text-sm">User is High Risk</p>
              )}
              {Number(
                reputationByUserId[lead.user_id]?.reputation_score ?? 50,
              ) > 20 &&
                Number(
                  reputationByUserId[lead.user_id]?.reputation_score ?? 50,
                ) <= 40 && (
                  <p className="text-lh-on-accent text-sm">
                    Low Reputation User
                  </p>
                )}
              <p className="text-sm font-medium">Lead #{lead.id}</p>
              <p className="text-lh-muted text-sm">User: {lead.user_id}</p>
              <div className="flex flex-wrap gap-2">
                {Boolean(trustByUserId[lead.user_id]?.phone_verified) && (
                  <span className="badge">Phone Verified</span>
                )}
                {Boolean(trustByUserId[lead.user_id]?.email_verified) && (
                  <span className="badge">Email Verified</span>
                )}
                {Number(trustByUserId[lead.user_id]?.trust_score ?? 50) >=
                  70 && <span className="badge">Trusted User</span>}
                {Number(trustByUserId[lead.user_id]?.trust_score ?? 50) >=
                  90 && <span className="badge">Premium User</span>}
                {Number(
                  reputationByUserId[lead.user_id]?.reputation_score ?? 50,
                ) >= 61 && <span className="badge">Trusted User</span>}
                {Number(
                  reputationByUserId[lead.user_id]?.reputation_score ?? 50,
                ) >= 81 && <span className="badge">Premium User</span>}
                {Number(
                  reputationByUserId[lead.user_id]?.completed_bookings ?? 0,
                ) >= 5 &&
                  Number(
                    reputationByUserId[lead.user_id]?.cancelled_bookings ?? 0,
                  ) === 0 && <span className="badge">Reliable Booker</span>}
                {Number(
                  reputationByUserId[lead.user_id]?.on_time_payments ?? 0,
                ) > 0 &&
                  Number(
                    reputationByUserId[lead.user_id]?.late_payments ?? 0,
                  ) === 0 && (
                    <span className="badge">Perfect Payment Record</span>
                  )}
              </div>
              <p className="text-lh-muted text-sm">
                Status: <span className="capitalize">{lead.status}</span>
              </p>
              <p className="text-lh-muted text-xs">
                {new Date(lead.created_at).toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => acceptLead(lead.id)}
                  disabled={lead.status !== "sent"}
                  className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-1 text-sm disabled:opacity-60"
                >
                  Accept lead
                </button>
                <button
                  type="button"
                  onClick={() => acceptLead(lead.id)}
                  disabled={lead.status !== "sent"}
                  className="border-lh-border rounded-lg border px-3 py-1 text-sm disabled:opacity-60"
                >
                  Accept instantly
                </button>
                <button
                  type="button"
                  onClick={() => ignoreLead(lead.id)}
                  disabled={lead.status !== "sent"}
                  className="border-lh-border rounded-lg border px-3 py-1 text-sm disabled:opacity-60"
                >
                  Ignore lead
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-lh-muted text-xs">Send custom quote</p>
                  <textarea
                    value={quoteDraftByLeadId[lead.id] ?? ""}
                    onChange={(event) =>
                      setQuoteDraftByLeadId((current) => ({
                        ...current,
                        [lead.id]: event.target.value,
                      }))
                    }
                    className="border-lh-border min-h-20 w-full rounded border px-2 py-1 text-sm"
                    placeholder="Draft a custom quote"
                  />
                  <button
                    type="button"
                    onClick={() => void sendCustomQuote(lead)}
                    className="border-lh-border rounded border px-3 py-1 text-xs"
                  >
                    Send custom quote
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-lh-muted text-xs">Request more info</p>
                  <textarea
                    value={infoRequestByLeadId[lead.id] ?? ""}
                    onChange={(event) =>
                      setInfoRequestByLeadId((current) => ({
                        ...current,
                        [lead.id]: event.target.value,
                      }))
                    }
                    className="border-lh-border min-h-20 w-full rounded border px-2 py-1 text-sm"
                    placeholder="Ask user for missing details"
                  />
                  <button
                    type="button"
                    onClick={() => void requestMoreInfo(lead)}
                    className="border-lh-border rounded border px-3 py-1 text-xs"
                  >
                    Request info
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
