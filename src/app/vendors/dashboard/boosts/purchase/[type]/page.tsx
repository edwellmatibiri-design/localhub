"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BoostType =
  | "search_boost"
  | "featured_vendor"
  | "featured_listing"
  | "category_sponsor"
  | "location_sponsor";

const TYPE_LABEL: Record<BoostType, string> = {
  search_boost: "Search Boost",
  featured_vendor: "Featured Vendor",
  featured_listing: "Featured Listing",
  category_sponsor: "Category Sponsor",
  location_sponsor: "Location Sponsor",
};

const TYPE_BASE_AMOUNT: Record<BoostType, number> = {
  search_boost: 49900,
  featured_vendor: 69900,
  featured_listing: 79900,
  category_sponsor: 99900,
  location_sponsor: 99900,
};

type Params = {
  type: string;
};

type OptionRow = {
  name: string;
  slug: string;
};

export default function PurchaseBoostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const [type, setType] = useState<BoostType | null>(null);
  const [vendorId, setVendorId] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [target, setTarget] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<OptionRow[]>([]);
  const [locationOptions, setLocationOptions] = useState<OptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    boostId: number;
    paymentIntentId: string;
    clientSecret: string | null;
  } | null>(null);

  useEffect(() => {
    void params.then((resolved) => {
      const resolvedType = String(resolved.type ?? "").trim() as BoostType;
      if (
        [
          "search_boost",
          "featured_vendor",
          "featured_listing",
          "category_sponsor",
          "location_sponsor",
        ].includes(resolvedType)
      ) {
        setType(resolvedType);
      }
    });

    const search = new URLSearchParams(window.location.search);
    setVendorId(String(search.get("vendorId") ?? "").trim());
  }, [params]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoriesResponse, locationsResponse] = await Promise.all([
          fetch("/api/boosts/options/categories"),
          fetch("/api/boosts/options/locations"),
        ]);

        const categoriesPayload = await categoriesResponse.json();
        const locationsPayload = await locationsResponse.json();

        if (categoriesResponse.ok) {
          setCategoryOptions(
            (
              (categoriesPayload?.categories ?? []) as Array<{
                name?: string;
                slug?: string;
              }>
            ).map((row) => ({
              name: String(row.name ?? ""),
              slug: String(row.slug ?? ""),
            })),
          );
        }

        if (locationsResponse.ok) {
          setLocationOptions(
            (
              (locationsPayload?.locations ?? []) as Array<{
                name?: string;
                slug?: string;
              }>
            ).map((row) => ({
              name: String(row.name ?? ""),
              slug: String(row.slug ?? ""),
            })),
          );
        }
      } catch {
        setCategoryOptions([]);
        setLocationOptions([]);
      }
    }

    void loadOptions();
  }, []);

  const amount = useMemo(() => {
    if (!type) return 0;
    const base = TYPE_BASE_AMOUNT[type];
    if (durationDays === 14) return Math.round(base * 1.8);
    if (durationDays === 30) return Math.round(base * 3.4);
    return base;
  }, [durationDays, type]);

  async function submit() {
    if (!type || !vendorId) {
      setError("Vendor and valid boost type are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/boosts/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          type,
          durationDays,
          target:
            type === "category_sponsor" || type === "location_sponsor"
              ? target
              : undefined,
          amount,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to create boost purchase"),
        );
      }

      setResult({
        boostId: Number(payload.boostId),
        paymentIntentId: String(payload.paymentIntentId ?? ""),
        clientSecret: payload.clientSecret
          ? String(payload.clientSecret)
          : null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create purchase",
      );
    } finally {
      setLoading(false);
    }
  }

  async function activatePurchasedBoost() {
    if (!result) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/boosts/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boostId: result.boostId,
          paymentIntentId: result.paymentIntentId,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to activate boost"));
      }

      window.location.href = `/vendors/dashboard/boosts?vendorId=${encodeURIComponent(vendorId)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate boost");
    } finally {
      setLoading(false);
    }
  }

  if (!type) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-danger text-sm">Invalid boost type.</p>
        </div>
      </section>
    );
  }

  const needsTarget =
    type === "category_sponsor" || type === "location_sponsor";
  const targetOptions =
    type === "category_sponsor" ? categoryOptions : locationOptions;

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Buy {TYPE_LABEL[type]}</h1>

      <div className="card space-y-3">
        <label className="grid gap-1 text-sm">
          <span className="text-lh-muted">Vendor ID</span>
          <input
            value={vendorId}
            onChange={(event) => setVendorId(event.target.value)}
            className="border-lh-border rounded-lg border px-3 py-2"
            placeholder="vendor_123"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-lh-muted">Duration</span>
          <select
            value={durationDays}
            onChange={(event) => setDurationDays(Number(event.target.value))}
            className="border-lh-border rounded-lg border px-3 py-2"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>

        {needsTarget && (
          <label className="grid gap-1 text-sm">
            <span className="text-lh-muted">Target</span>
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="border-lh-border rounded-lg border px-3 py-2"
            >
              <option value="">Select target</option>
              {targetOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <p className="text-lh-muted text-sm">
          Amount: R {(amount / 100).toLocaleString("en-ZA")}
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Purchase"}
        </button>

        {error && <p className="text-lh-danger text-sm">{error}</p>}
      </div>

      {result && (
        <div className="card space-y-2">
          <p className="text-lh-muted text-sm">
            Boost created and awaiting payment.
          </p>
          <p className="text-sm">Boost ID: {result.boostId}</p>
          <p className="text-sm">Payment Intent ID: {result.paymentIntentId}</p>
          <p className="text-lh-muted text-xs break-all">
            Client Secret: {result.clientSecret ?? "-"}
          </p>
          <button
            type="button"
            onClick={activatePurchasedBoost}
            disabled={loading}
            className="border-lh-border rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            I have paid, activate boost
          </button>
        </div>
      )}

      <Link
        href={`/vendors/dashboard/boosts?vendorId=${encodeURIComponent(vendorId)}`}
        className="text-lh-accent text-sm font-medium hover:underline"
      >
        Back to boosts dashboard
      </Link>
    </section>
  );
}
