import { NextResponse } from "next/server";

const INTENT_CLUSTER_URL =
  "https://ehtbpvfdqmeeskyxvlyo.supabase.co/functions/v1/intent-cluster";

type IntentClusterRequest = {
  keyword?: string;
};

export async function POST(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "SUPABASE_SERVICE_ROLE_KEY is not configured",
      },
      { status: 500 },
    );
  }

  let body: IntentClusterRequest;
  try {
    body = (await request.json()) as IntentClusterRequest;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON body",
      },
      { status: 400 },
    );
  }

  const keyword = String(body?.keyword ?? "").trim();
  if (!keyword) {
    return NextResponse.json(
      {
        ok: false,
        error: "keyword is required",
      },
      { status: 400 },
    );
  }

  try {
    const upstreamResponse = await fetch(INTENT_CLUSTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ keyword }),
    });

    let data: unknown;
    try {
      data = await upstreamResponse.json();
    } catch {
      data = {
        ok: false,
        error: "Supabase function returned a non-JSON response",
      };
    }

    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to call intent-cluster function",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
