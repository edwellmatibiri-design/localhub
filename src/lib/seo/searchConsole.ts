export type SearchConsoleMetric = {
  path: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
};

export type EngagementMetric = {
  path: string;
  bounce: number;
  dwellSeconds: number;
};

type SearchConsoleAuth = {
  accessToken: string;
  siteUrl: string;
  expiresAt: number;
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

const tokenCache: { value: SearchConsoleAuth | null } = {
  value: null,
};

function hasValidCachedToken(now = Date.now()): boolean {
  return Boolean(tokenCache.value && tokenCache.value.expiresAt > now + 15_000);
}

export async function getSearchConsoleAuth(): Promise<SearchConsoleAuth | null> {
  if (hasValidCachedToken()) {
    return tokenCache.value;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

  // Secrets should be stored in Supabase project secrets and exposed to runtime envs.
  if (!clientId || !clientSecret || !refreshToken || !siteUrl) {
    return null;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as GoogleTokenResponse;
  if (!json.access_token || !json.expires_in) {
    return null;
  }

  const auth: SearchConsoleAuth = {
    accessToken: json.access_token,
    siteUrl,
    expiresAt: Date.now() + json.expires_in * 1000,
  };

  tokenCache.value = auth;
  return auth;
}

type SearchConsoleApiRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SearchConsoleApiResponse = {
  rows?: SearchConsoleApiRow[];
};

export async function fetchSearchConsoleMetrics(
  startDate: string,
  endDate: string,
): Promise<SearchConsoleMetric[]> {
  const auth = await getSearchConsoleAuth();
  if (!auth) {
    return [];
  }

  const encodedSiteUrl = encodeURIComponent(auth.siteUrl);
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${auth.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["date", "page"],
      rowLimit: 1000,
      dataState: "final",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as SearchConsoleApiResponse;
  const rows = json.rows ?? [];

  return rows
    .map((row) => {
      const date = row.keys?.[0] ?? "";
      const fullPath = row.keys?.[1] ?? "";

      let path = "/";
      try {
        path = fullPath ? new URL(fullPath).pathname : "/";
      } catch {
        path = "/";
      }

      return {
        path,
        date,
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        ctr: Number(row.ctr ?? 0),
        position: Number(row.position ?? 0),
      } satisfies SearchConsoleMetric;
    })
    .filter((row) => row.date.length > 0);
}

export async function fetchEngagementMetrics(): Promise<EngagementMetric[]> {
  return [];
}
