"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";

type QuoteRow = {
  id: string;
  vendor_id: string;
  user_id: string;
  message: string;
  preferred_date: string;
  status: string;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
};

export default function VendorQuotesInboxPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserRow>>({});
  const [vendorId, setVendorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuotes() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const searchVendorId =
          new URLSearchParams(window.location.search).get("vendorId") ?? "";
        let activeVendorId = searchVendorId;

        if (!activeVendorId) {
          const { data: vendor } = await supabase
            .from("seller_profiles")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          activeVendorId = String(vendor?.id ?? "");
        }

        setVendorId(activeVendorId);
        if (!activeVendorId) {
          setQuotes([]);
          return;
        }

        const { data: quoteRows, error: quotesError } = await supabase
          .from("quotes")
          .select("id, vendor_id, user_id, message, preferred_date, status")
          .eq("vendor_id", activeVendorId)
          .order("preferred_date", { ascending: true });

        if (quotesError) {
          throw quotesError;
        }

        const normalizedQuotes = (quoteRows ?? []) as QuoteRow[];
        setQuotes(normalizedQuotes);

        const userIds = Array.from(
          new Set(normalizedQuotes.map((quote) => quote.user_id)),
        ).filter(Boolean);
        if (userIds.length === 0) {
          setUsersById({});
          return;
        }

        const { data: userRows, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds);

        if (usersError) {
          throw usersError;
        }

        const mapped: Record<string, UserRow> = {};
        (userRows ?? []).forEach((user) => {
          mapped[String(user.id)] = {
            id: String(user.id),
            full_name: String(user.full_name ?? "User"),
            email: user.email ? String(user.email) : null,
          };
        });

        setUsersById(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quotes");
      } finally {
        setLoading(false);
      }
    }

    loadQuotes();
  }, []);

  const pendingCount = useMemo(
    () => quotes.filter((quote) => quote.status === "new").length,
    [quotes],
  );

  async function updateQuote(quoteId: string, action: "accept" | "reject") {
    try {
      const response = await fetch(`/api/quotes/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? `Failed to ${action} quote`));
      }

      setQuotes((current) =>
        current.map((quote) =>
          quote.id === quoteId
            ? {
                ...quote,
                status: action === "accept" ? "accepted" : "rejected",
              }
            : quote,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} quote`,
      );
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <div className="card space-y-1">
        <h1 className="text-2xl font-semibold">Vendor Quote Inbox</h1>
        <p className="text-lh-muted text-sm">
          Vendor ID: {vendorId || "Not selected"}
        </p>
        <p className="text-lh-muted text-sm">Pending quotes: {pendingCount}</p>
      </div>

      {loading && (
        <p className="card text-lh-muted text-sm">Loading quotes...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && quotes.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No incoming quotes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const user = usersById[quote.user_id];
            return (
              <article key={quote.id} className="card space-y-2">
                <p className="text-sm font-medium">
                  User: {user?.full_name ?? "Unknown user"}
                </p>
                <p className="text-lh-muted text-sm">
                  Email: {user?.email ?? "No email"}
                </p>
                <p className="text-lh-muted text-sm">
                  Message: {quote.message}
                </p>
                <p className="text-lh-muted text-sm">
                  Preferred date:{" "}
                  {new Date(quote.preferred_date).toLocaleDateString()}
                </p>
                <p className="text-lh-muted text-sm">
                  Status: <span className="capitalize">{quote.status}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuote(quote.id, "accept")}
                    className="bg-lh-accent text-lh-on-accent rounded-lg px-3 py-1 text-sm"
                  >
                    Accept quote
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQuote(quote.id, "reject")}
                    className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                  >
                    Reject quote
                  </button>
                  <button
                    type="button"
                    className="border-lh-border rounded-lg border px-3 py-1 text-sm"
                  >
                    Send message
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
