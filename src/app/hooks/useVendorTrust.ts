"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type VendorTrustSignals = {
  averageRating: number;
  reviewCount: number;
  recentReviews: number;
  profileCompleteness: number;
  disputeCount: number;
};

type VendorTrustData = {
  vendorId: string;
  trustScore: number;
  signals: VendorTrustSignals;
};

type VendorBadge = "gold" | "silver" | "bronze" | "none";

export function useVendorTrust(vendorId: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VendorTrustData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedVendorId = useMemo(
    () => String(vendorId ?? "").trim(),
    [vendorId],
  );

  const refresh = useCallback(async () => {
    if (!normalizedVendorId) {
      setData(null);
      setError("vendorId is required");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vendor/trust/compute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorId: normalizedVendorId }),
      });

      const payload = (await response.json()) as
        | VendorTrustData
        | { error?: string };
      if (!response.ok) {
        setData(null);
        setError(
          String(
            (payload as { error?: string }).error ??
              "Failed to compute vendor trust",
          ),
        );
        return null;
      }

      const result = payload as VendorTrustData;
      setData(result);
      return result;
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error ? err.message : "Failed to compute vendor trust",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [normalizedVendorId]);

  const update = useCallback(async () => {
    if (!normalizedVendorId) {
      return { ok: false, error: "vendorId is required" };
    }

    try {
      const response = await fetch("/api/vendor/trust/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorId: normalizedVendorId }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !payload?.ok) {
        return {
          ok: false,
          error: payload?.error ?? "Failed to update vendor trust",
        };
      }

      await refresh();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to update vendor trust",
      };
    }
  }, [normalizedVendorId, refresh]);

  const getBadge = useCallback(async () => {
    if (!normalizedVendorId) {
      return {
        ok: false,
        error: "vendorId is required",
        badge: "none" as VendorBadge,
      };
    }

    try {
      const response = await fetch("/api/vendor/trust/badge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorId: normalizedVendorId }),
      });

      const payload = (await response.json()) as {
        badge?: VendorBadge;
        trustScore?: number;
        error?: string;
      };

      if (!response.ok) {
        return {
          ok: false,
          error: payload?.error ?? "Failed to fetch trust badge",
          badge: "none" as VendorBadge,
        };
      }

      return {
        ok: true,
        badge: payload.badge ?? "none",
        trustScore: Number(payload.trustScore) || 0,
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to fetch trust badge",
        badge: "none" as VendorBadge,
      };
    }
  }, [normalizedVendorId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    data,
    error,
    refresh,
    update,
    getBadge,
  };
}
