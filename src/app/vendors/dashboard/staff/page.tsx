"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import type { PermissionFlags, StaffRole } from "@/lib/staff/permissions";

type StaffRow = {
  id: number;
  vendor_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  permissions: PermissionFlags;
  is_active: boolean;
  disabled_at: string | null;
  last_activity: string | null;
  created_at: string;
};

const ROLES: StaffRole[] = [
  "owner",
  "manager",
  "team_lead",
  "worker",
  "viewer",
];

export default function VendorStaffDashboardPage() {
  const [vendorId, setVendorId] = useState("");
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("worker");
  const [permissionsJson, setPermissionsJson] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const queryVendorId =
        new URLSearchParams(window.location.search).get("vendorId") ?? "";
      let activeVendorId = queryVendorId;

      if (!activeVendorId) {
        const { data: profile } = await supabase
          .from("seller_profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        activeVendorId = String(profile?.id ?? "");
      }

      setVendorId(activeVendorId);
      if (!activeVendorId) {
        setRows([]);
        return;
      }

      const { data, error: readError } = await supabase
        .from("staff")
        .select(
          "id, vendor_id, name, email, phone, role, permissions, is_active, disabled_at, last_activity, created_at",
        )
        .eq("vendor_id", activeVendorId)
        .order("created_at", { ascending: false });

      if (readError) throw readError;
      setRows((data ?? []) as StaffRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeCount = useMemo(
    () => rows.filter((row) => !row.disabled_at).length,
    [rows],
  );

  async function inviteStaff() {
    setError(null);
    try {
      const parsed = JSON.parse(permissionsJson || "{}");
      const response = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          name,
          email,
          phone: phone || null,
          role,
          permissions: parsed,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to invite staff"));
      setName("");
      setEmail("");
      setPhone("");
      setRole("worker");
      setPermissionsJson("{}");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite staff");
    }
  }

  async function removeStaff(staffId: number) {
    setError(null);
    try {
      const response = await fetch("/api/staff/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, action: "remove" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to remove staff"));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove staff");
    }
  }

  async function changeRole(staffId: number, nextRole: StaffRole) {
    setError(null);
    try {
      const response = await fetch("/api/staff/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          action: "change_role",
          role: nextRole,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to change role"));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    }
  }

  async function updatePermissions(staffId: number, existing: PermissionFlags) {
    setError(null);
    try {
      const next = {
        ...existing,
        bookings: !Boolean(existing.bookings),
      };
      const response = await fetch("/api/staff/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          action: "update_permissions",
          permissions: next,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(
          String(payload?.error ?? "Failed to update permissions"),
        );
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update permissions",
      );
    }
  }

  async function editStaff(
    staffId: number,
    currentName: string,
    currentPhone: string | null,
  ) {
    setError(null);
    const nextName =
      window.prompt("Update staff name", currentName) ?? currentName;
    const nextPhone =
      window.prompt("Update staff phone", currentPhone ?? "") ??
      currentPhone ??
      "";

    try {
      const response = await fetch("/api/staff/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          action: "edit",
          name: nextName,
          phone: nextPhone,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to edit staff"));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit staff");
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <div className="card space-y-2">
        <h1 className="text-2xl font-semibold">Vendor Staff Dashboard</h1>
        <p className="text-lh-muted text-sm">
          Vendor: {vendorId || "Not selected"}
        </p>
        <p className="text-lh-muted text-sm">Active staff: {activeCount}</p>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Add staff</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className="border-lh-border rounded border px-3 py-2 text-sm"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="border-lh-border rounded border px-3 py-2 text-sm"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone (optional)"
            className="border-lh-border rounded border px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole)}
            className="border-lh-border rounded border px-3 py-2 text-sm"
          >
            {ROLES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={permissionsJson}
          onChange={(event) => setPermissionsJson(event.target.value)}
          rows={3}
          className="border-lh-border w-full rounded border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void inviteStaff()}
          disabled={!vendorId || !name || !email}
          className="bg-lh-accent text-lh-on-accent rounded px-4 py-2 text-sm disabled:opacity-60"
        >
          Invite staff
        </button>
      </section>

      {loading && (
        <p className="card text-lh-muted text-sm">Loading staff...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && (
        <section className="space-y-3">
          {rows.length === 0 ? (
            <div className="card">
              <p className="text-lh-muted text-sm">No staff members found.</p>
            </div>
          ) : (
            rows.map((staff) => (
              <article key={staff.id} className="card space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{staff.name}</p>
                  <span className="text-lh-muted text-xs">
                    {staff.disabled_at
                      ? "Disabled"
                      : staff.is_active
                        ? "Active"
                        : "Invited"}
                  </span>
                </div>
                <p className="text-lh-muted text-sm">
                  {staff.email} {staff.phone ? `| ${staff.phone}` : ""}
                </p>
                <p className="text-lh-muted text-sm">Role: {staff.role}</p>
                <p className="text-lh-muted text-xs">
                  Permissions: {JSON.stringify(staff.permissions)}
                </p>
                <p className="text-lh-muted text-xs">
                  Last activity:{" "}
                  {staff.last_activity
                    ? new Date(staff.last_activity).toLocaleString()
                    : "-"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void editStaff(staff.id, staff.name, staff.phone)
                    }
                    className="border-lh-border rounded border px-3 py-1 text-xs"
                  >
                    Edit staff
                  </button>
                  <select
                    value={staff.role}
                    onChange={(event) =>
                      void changeRole(staff.id, event.target.value as StaffRole)
                    }
                    className="border-lh-border rounded border px-2 py-1 text-xs"
                  >
                    {ROLES.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      void updatePermissions(staff.id, staff.permissions)
                    }
                    className="border-lh-border rounded border px-3 py-1 text-xs"
                  >
                    Update permissions
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeStaff(staff.id)}
                    className="border-lh-danger text-lh-danger rounded border px-3 py-1 text-xs"
                  >
                    Remove staff
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </section>
  );
}
