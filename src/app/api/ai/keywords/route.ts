import { appOk, requireInternalApiSecretFromRequest } from "@/lib/api";

export async function POST(request: Request) {
  const denied = requireInternalApiSecretFromRequest(request);
  if (denied) return denied;

  return appOk({
    clusters: [
      { keyword: "plumber near me", score: 91 },
      { keyword: "home movers cape town", score: 84 },
      { keyword: "electric fence installer", score: 88 },
    ],
  });
}
