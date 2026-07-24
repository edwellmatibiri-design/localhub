import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import type { PermissionFlags, StaffRole } from "@/lib/staff/permissions";
import { resolvePermissions } from "@/lib/staff/permissions";

type Body = {
  vendorId?: string;
  name?: string;
  email?: string;
  role?: StaffRole;
  permissions?: PermissionFlags;
  phone?: string;
};

const ALLOWED_ROLES = new Set<StaffRole>([
  "owner",
  "manager",
  "team_lead",
  "worker",
  "viewer",
]);

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

  const vendorId = String(body.vendorId ?? "").trim();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const role = String(body.role ?? "worker") as StaffRole;
  const phone = body.phone ? String(body.phone) : null;

  if (!vendorId || !name || !email || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json(
      { ok: false, error: "vendorId, name, email and valid role are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const token = randomBytes(24).toString("hex");
    const permissions = resolvePermissions(role, body.permissions ?? {});

    const { data: created, error } = await supabase
      .from("staff")
      .insert({
        vendor_id: vendorId,
        name,
        email,
        phone,
        role,
        permissions,
        invite_token: token,
        is_active: false,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    // Placeholder invitation email notification
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: vendorId,
      type: "staff_invitation",
      message: `Invitation created for ${email}. Acceptance token: ${token}`,
    });

    return NextResponse.json({ ok: true, staffId: Number(created.id) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to invite staff",
      },
      { status: 500 },
    );
  }
}
