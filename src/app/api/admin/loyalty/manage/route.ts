import { NextResponse } from "next/server";
import { awardPoints } from "@/lib/loyalty/awardPoints";
import { revokeUserBadge } from "@/lib/loyalty/badges";

type Body = {
  action?: "adjust_points" | "issue_promo_bonus" | "revoke_badge";
  userId?: string;
  points?: number | string;
  badge?: string;
};

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

  const action = String(body.action ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const points = Number(body.points);
  const badge = String(body.badge ?? "").trim();

  if (!action || !userId) {
    return NextResponse.json(
      { ok: false, error: "action and userId are required" },
      { status: 400 },
    );
  }

  try {
    if (action === "adjust_points") {
      if (!Number.isFinite(points) || points === 0) {
        return NextResponse.json(
          { ok: false, error: "points must be a non-zero number" },
          { status: 400 },
        );
      }
      await awardPoints({
        userId,
        type: "admin_adjustment",
        adjustmentPoints: points,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "issue_promo_bonus") {
      if (!Number.isFinite(points) || points <= 0) {
        return NextResponse.json(
          { ok: false, error: "points must be a positive number" },
          { status: 400 },
        );
      }
      await awardPoints({
        userId,
        type: "promo_bonus",
        promoBonusPoints: points,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "revoke_badge") {
      if (!badge) {
        return NextResponse.json(
          { ok: false, error: "badge is required" },
          { status: 400 },
        );
      }
      await revokeUserBadge(userId, badge);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to manage loyalty",
      },
      { status: 500 },
    );
  }
}
