import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import type { PermissionFlags, StaffRole } from "@/lib/staff/permissions";
import { resolvePermissions } from "@/lib/staff/permissions";

type Action =
  | "edit"
  | "remove"
  | "change_role"
  | "update_permissions"
  | "disable"
  | "reset_permissions";

type Body = {
  staffId?: number | string;
  action?: Action;
  name?: string;
  phone?: string | null;
  role?: StaffRole;
  permissions?: PermissionFlags;
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

  const staffId = Number(body.staffId);
  const action = String(body.action ?? "") as Action;

  if (!Number.isFinite(staffId) || staffId <= 0 || !action) {
    return NextResponse.json(
      { ok: false, error: "staffId and action are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    if (action === "remove") {
      const { error } = await supabase.from("staff").delete().eq("id", staffId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "disable") {
      const { error } = await supabase
        .from("staff")
        .update({ disabled_at: new Date().toISOString(), is_active: false })
        .eq("id", staffId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "edit") {
      const name = body.name ? String(body.name).trim() : null;
      const phone =
        body.phone === null
          ? null
          : body.phone
            ? String(body.phone).trim()
            : null;
      const payload: Record<string, unknown> = {
        last_activity: new Date().toISOString(),
      };
      if (name) payload.name = name;
      if (body.phone !== undefined) payload.phone = phone;

      const { error } = await supabase
        .from("staff")
        .update(payload)
        .eq("id", staffId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id, role, permissions")
      .eq("id", staffId)
      .maybeSingle();

    if (staffError) throw new Error(staffError.message);
    if (!staff) {
      return NextResponse.json(
        { ok: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    if (action === "change_role") {
      const role = String(body.role ?? "") as StaffRole;
      if (!ALLOWED_ROLES.has(role)) {
        return NextResponse.json(
          { ok: false, error: "Valid role is required" },
          { status: 400 },
        );
      }

      const permissions = resolvePermissions(
        role,
        (staff.permissions ?? {}) as PermissionFlags,
      );
      const { error } = await supabase
        .from("staff")
        .update({ role, permissions, last_activity: new Date().toISOString() })
        .eq("id", staffId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "update_permissions") {
      const role = String(staff.role ?? "worker") as StaffRole;
      const permissions = resolvePermissions(role, body.permissions ?? {});
      const { error } = await supabase
        .from("staff")
        .update({ permissions, last_activity: new Date().toISOString() })
        .eq("id", staffId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "reset_permissions") {
      const role = String(staff.role ?? "worker") as StaffRole;
      const permissions = resolvePermissions(role, {});
      const { error } = await supabase
        .from("staff")
        .update({ permissions, last_activity: new Date().toISOString() })
        .eq("id", staffId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported action" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to manage staff",
      },
      { status: 500 },
    );
  }
}
