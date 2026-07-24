type ClusterIntentErrorResult = {
  ok: false;
  error: string;
  status?: number;
  details?: string;
};

export async function clusterIntent(
  keyword: string,
): Promise<unknown | ClusterIntentErrorResult> {
  const normalizedKeyword = String(keyword ?? "").trim();
  if (!normalizedKeyword) {
    return { ok: false, error: "keyword is required" };
  }

  try {
    const response = await fetch("/api/intent/cluster", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyword: normalizedKeyword }),
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return {
        ok: false,
        error: "Intent cluster API returned a non-JSON response",
        status: response.status,
      };
    }

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null && "error" in data
          ? String(
              (data as { error?: unknown }).error ??
                "Intent cluster API request failed",
            )
          : "Intent cluster API request failed";

      return {
        ok: false,
        error: message,
        status: response.status,
      };
    }

    return data;
  } catch (error) {
    return {
      ok: false,
      error: "Failed to call /api/intent/cluster",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
