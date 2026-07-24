import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type RoutingStrategy =
  | "round_robin"
  | "top_ranked"
  | "balanced"
  | "fastest_response";

type Body = {
  id?: number | string;
  category?: string;
  location?: string;
  max_vendors?: number;
  routing_strategy?: RoutingStrategy;
};

const ALLOWED_STRATEGIES: RoutingStrategy[] = [
  "round_robin",
  "top_ranked",
  "balanced",
  "fastest_response",
];

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("lead_routing_rules")
      .select(
        "id, category, location, max_vendors, routing_strategy, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, rules: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load rules",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const category = normalize(body.category);
  const location = normalize(body.location);
  const maxVendors = Number(body.max_vendors ?? 3);
  const strategy = String(body.routing_strategy ?? "") as RoutingStrategy;

  if (!category || !location || !ALLOWED_STRATEGIES.includes(strategy)) {
    return NextResponse.json(
      {
        ok: false,
        error: "category, location and valid routing_strategy are required",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("lead_routing_rules")
      .upsert(
        {
          category,
          location,
          max_vendors:
            Number.isFinite(maxVendors) && maxVendors > 0
              ? Math.floor(maxVendors)
              : 3,
          routing_strategy: strategy,
        },
        { onConflict: "category,location" },
      )
      .select(
        "id, category, location, max_vendors, routing_strategy, created_at",
      )
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, rule: data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save rule",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const id = Number(body.id);
  const strategy = String(body.routing_strategy ?? "") as RoutingStrategy;
  const maxVendors = Number(body.max_vendors ?? 3);

  if (
    !Number.isFinite(id) ||
    id <= 0 ||
    !ALLOWED_STRATEGIES.includes(strategy)
  ) {
    return NextResponse.json(
      { ok: false, error: "id and valid routing_strategy are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("lead_routing_rules")
      .update({
        max_vendors:
          Number.isFinite(maxVendors) && maxVendors > 0
            ? Math.floor(maxVendors)
            : 3,
        routing_strategy: strategy,
      })
      .eq("id", id)
      .select(
        "id, category, location, max_vendors, routing_strategy, created_at",
      )
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, rule: data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update rule",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const id = Number(body.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json(
      { ok: false, error: "id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("lead_routing_rules")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to delete rule",
      },
      { status: 500 },
    );
  }
}
