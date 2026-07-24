"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type CalendarEvent = {
  id: number;
  vendor_id: string;
  staff_id: number | null;
  booking_id: number | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
};

type Assignment = {
  id: number;
  booking_id: number;
  status: string;
  created_at: string;
};

export default function StaffCalendarPage() {
  const [staffId, setStaffId] = useState<number>(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const supabase = createClient();
      const requestedStaffId = Number(
        new URLSearchParams(window.location.search).get("staffId"),
      );
      let activeStaffId =
        Number.isFinite(requestedStaffId) && requestedStaffId > 0
          ? requestedStaffId
          : 0;

      if (!activeStaffId) {
        const { data: fallbackStaff } = await supabase
          .from("staff")
          .select("id")
          .is("disabled_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        activeStaffId = Number(fallbackStaff?.id ?? 0);
      }

      setStaffId(activeStaffId);
      if (!activeStaffId) {
        setEvents([]);
        setAssignments([]);
        return;
      }

      const [
        { data: eventRows, error: eventsError },
        { data: assignmentRows, error: assignmentsError },
      ] = await Promise.all([
        supabase
          .from("vendor_calendar_events")
          .select(
            "id, vendor_id, staff_id, booking_id, title, description, start_at, end_at, status",
          )
          .eq("staff_id", activeStaffId)
          .order("start_at", { ascending: true })
          .limit(300),
        supabase
          .from("job_assignments")
          .select("id, booking_id, status, created_at")
          .eq("staff_id", activeStaffId)
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

      if (eventsError) throw eventsError;
      if (assignmentsError) throw assignmentsError;

      setEvents((eventRows ?? []) as CalendarEvent[]);
      setAssignments((assignmentRows ?? []) as Assignment[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load staff calendar",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(
    eventId: number,
    status: "in_progress" | "completed",
  ) {
    setError(null);
    const response = await fetch("/api/scheduling/calendar/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, action: "status", status }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to update status"));
      return;
    }
    await load();
  }

  async function updateAssignment(
    assignmentId: number,
    status: "in_progress" | "completed",
  ) {
    setError(null);
    const response = await fetch("/api/jobs/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, status }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to update assignment"));
      return;
    }
    await load();
  }

  if (!staffId) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-muted text-sm">No staff selected.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Staff Calendar</h1>
      <p className="text-lh-muted text-sm">Staff ID: {staffId}</p>
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Staff-specific events</h2>
        {events.length === 0 ? (
          <p className="text-lh-muted text-sm">No calendar events assigned.</p>
        ) : (
          events.map((event) => (
            <article
              key={event.id}
              className="border-lh-border space-y-2 rounded border p-3"
            >
              <p className="font-medium">{event.title}</p>
              <p className="text-lh-muted text-xs">
                {new Date(String(event.start_at)).toLocaleString()} -{" "}
                {new Date(String(event.end_at)).toLocaleString()}
              </p>
              <p className="text-lh-muted text-xs">
                Status: {String(event.status)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void updateStatus(event.id, "in_progress")}
                  className="border-lh-border rounded border px-3 py-1 text-xs"
                >
                  Mark in_progress
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(event.id, "completed")}
                  className="border-lh-border rounded border px-3 py-1 text-xs"
                >
                  Mark completed
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Assigned jobs</h2>
        {assignments.length === 0 ? (
          <p className="text-lh-muted text-sm">No assigned jobs.</p>
        ) : (
          assignments.map((assignment) => (
            <article
              key={assignment.id}
              className="border-lh-border space-y-1 rounded border p-3"
            >
              <p className="font-medium">Assignment #{assignment.id}</p>
              <p className="text-lh-muted text-xs">
                Booking: {assignment.booking_id}
              </p>
              <p className="text-lh-muted text-xs">
                Status: {assignment.status}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void updateAssignment(assignment.id, "in_progress")
                  }
                  className="border-lh-border rounded border px-3 py-1 text-xs"
                >
                  Mark in_progress
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void updateAssignment(assignment.id, "completed")
                  }
                  className="border-lh-border rounded border px-3 py-1 text-xs"
                >
                  Mark completed
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
