import { NextResponse } from "next/server";

const INTENT_CLUSTER_URL =
  "https://ehtbpvfdqmeeskyxvlyo.supabase.co/functions/v1/intent-cluster";

export async function POST() {
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

  try {
    const upstreamResponse = await fetch(INTENT_CLUSTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        keyword: "tree felling services near me",
        source: "manual-test",
      }),
    });

    const data = await upstreamResponse.json();
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
