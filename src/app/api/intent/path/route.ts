import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  from?: string;
  to?: string;
};

function bfsShortestPath(
  from: string,
  to: string,
  adjacency: Map<string, string[]>,
) {
  if (from === to) return [from];

  const queue: string[] = [from];
  const visited = new Set<string>([from]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const neighbors = adjacency.get(current) ?? [];

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;

      visited.add(neighbor);
      parent.set(neighbor, current);

      if (neighbor === to) {
        const path = [to];
        let cursor = to;

        while (parent.has(cursor)) {
          cursor = parent.get(cursor) as string;
          path.push(cursor);
        }

        path.reverse();
        return path;
      }

      queue.push(neighbor);
    }
  }

  return [];
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const from = String(body.from ?? "").trim();
  const to = String(body.to ?? "").trim();

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: edges, error: edgesError } = await supabase
      .from("intent_edges")
      .select("source_node_id, target_node_id");

    if (edgesError) {
      return NextResponse.json({ error: edgesError.message }, { status: 500 });
    }

    const adjacency = new Map<string, string[]>();
    (edges ?? []).forEach((edge) => {
      const source = String(edge.source_node_id ?? "").trim();
      const target = String(edge.target_node_id ?? "").trim();
      if (!source || !target) return;

      const list = adjacency.get(source) ?? [];
      list.push(target);
      adjacency.set(source, list);
    });

    const path = bfsShortestPath(from, to, adjacency);

    return NextResponse.json({
      from,
      to,
      path,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to compute intent path",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
