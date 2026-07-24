"use client";

import { useEffect, useMemo, useState } from "react";

type GeneratedFaq = {
  question: string;
  answer: string;
};

export type GeneratedPageData = {
  intentId: string;
  title: string;
  metaDescription: string;
  h1: string;
  h2: string[];
  h3: string[];
  faqs: GeneratedFaq[];
  schema: Record<string, unknown>;
  internalLinks: string[];
};

type ApiError = {
  error?: string;
  details?: string;
};

export function useGeneratePage(intentId: string) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<GeneratedPageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedIntentId = useMemo(
    () => String(intentId ?? "").trim(),
    [intentId],
  );

  async function generate() {
    if (!normalizedIntentId) {
      setData(null);
      setError("intentId is required");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/page/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ intentId: normalizedIntentId }),
      });

      const payload = (await response.json()) as GeneratedPageData | ApiError;
      if (!response.ok) {
        setData(null);
        setError(
          String((payload as ApiError).error ?? "Failed to generate page"),
        );
        return null;
      }

      const generated = payload as GeneratedPageData;
      setData(generated);
      setError(null);
      return generated;
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to generate page");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function save(override?: GeneratedPageData) {
    const toSave = override ?? data;

    if (!toSave) {
      return { ok: false, error: "No generated page data to save" };
    }

    setSaving(true);
    try {
      const response = await fetch("/api/page/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toSave),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !payload?.ok) {
        return {
          ok: false,
          error: payload?.error ?? "Failed to save generated page",
        };
      }

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to save generated page",
      };
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!normalizedIntentId) {
      setData(null);
      setError("intentId is required");
      return;
    }

    generate();
  }, [normalizedIntentId]);

  return {
    loading,
    saving,
    data,
    error,
    regenerate: generate,
    save,
  };
}
