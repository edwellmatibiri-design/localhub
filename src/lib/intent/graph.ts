async function postJson<TPayload, TResult>(
  url: string,
  payload: TPayload,
): Promise<TResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as TResult & { error?: string };
    if (!response.ok) {
      throw new Error(data?.error ?? `Request failed for ${url}`);
    }

    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : `Failed to call ${url}`,
    );
  }
}

export async function getIntent(intentId: string) {
  const normalizedIntentId = String(intentId ?? "").trim();
  if (!normalizedIntentId) {
    throw new Error("intentId is required");
  }

  return postJson<{ intentId: string }, { intent: unknown; edges: unknown[] }>(
    "/api/intent/get",
    {
      intentId: normalizedIntentId,
    },
  );
}

export async function getRelatedIntents(intentId: string) {
  const normalizedIntentId = String(intentId ?? "").trim();
  if (!normalizedIntentId) {
    throw new Error("intentId is required");
  }

  return postJson<
    { intentId: string },
    { intentId: string; relatedIntents: unknown[] }
  >("/api/intent/related", {
    intentId: normalizedIntentId,
  });
}

export async function getCanonicalIntent(keyword: string) {
  const normalizedKeyword = String(keyword ?? "").trim();
  if (!normalizedKeyword) {
    throw new Error("keyword is required");
  }

  return postJson<
    { keyword: string },
    { canonicalIntentId: string | null; canonicalIntent: unknown | null }
  >("/api/intent/canonical", {
    keyword: normalizedKeyword,
  });
}

export async function getIntentPath(from: string, to: string) {
  const normalizedFrom = String(from ?? "").trim();
  const normalizedTo = String(to ?? "").trim();

  if (!normalizedFrom || !normalizedTo) {
    throw new Error("from and to are required");
  }

  return postJson<
    { from: string; to: string },
    { from: string; to: string; path: string[] }
  >("/api/intent/path", {
    from: normalizedFrom,
    to: normalizedTo,
  });
}

export function detectMicroIntent(keyword: string): string | null {
  const normalized = keyword.toLowerCase();
  if (
    normalized.includes("price") ||
    normalized.includes("cost") ||
    normalized.includes("quote")
  )
    return "price";
  if (
    normalized.includes("emergency") ||
    normalized.includes("24/7") ||
    normalized.includes("urgent")
  )
    return "emergency";
  if (
    normalized.includes("best") ||
    normalized.includes("top") ||
    normalized.includes("rated")
  )
    return "best-rated";
  return null;
}
