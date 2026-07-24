"use client";

import { useMemo, useState } from "react";

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

type ViewMode = "month" | "week" | "day";

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function CalendarBoard({
  vendorId,
  initialEvents,
}: {
  vendorId: string;
  initialEvents: CalendarEvent[];
}) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [view, setView] = useState<ViewMode>("week");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const keys = useMemo(() => {
    if (view === "day") {
      return [dateKey(today.toISOString())];
    }

    if (view === "month") {
      const first = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      );
      const daysInMonth = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
      ).getUTCDate();
      return Array.from({ length: daysInMonth }, (_, index) => {
        const next = new Date(first);
        next.setUTCDate(first.getUTCDate() + index);
        return dateKey(next.toISOString());
      });
    }

    const start = new Date(today);
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() - day);
    return Array.from({ length: 7 }, (_, index) => {
      const next = new Date(start);
      next.setUTCDate(start.getUTCDate() + index);
      return dateKey(next.toISOString());
    });
  }, [view, today]);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    keys.forEach((key) => map.set(key, []));
    events.forEach((event) => {
      const key = dateKey(event.start_at);
      if (!map.has(key)) {
        if (view === "month") return;
        map.set(key, []);
      }
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [events, keys, view]);

  async function moveEvent(eventId: number, targetDate: string) {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) return;

    const start = new Date(event.start_at);
    const end = new Date(event.end_at);

    const [year, month, day] = targetDate
      .split("-")
      .map((part) => Number(part));
    const nextStart = new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        start.getUTCHours(),
        start.getUTCMinutes(),
        0,
        0,
      ),
    );
    const nextEnd = new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        end.getUTCHours(),
        end.getUTCMinutes(),
        0,
        0,
      ),
    );

    setError(null);
    const previous = [...events];
    setEvents((current) =>
      current.map((entry) =>
        entry.id === eventId
          ? {
              ...entry,
              start_at: nextStart.toISOString(),
              end_at: nextEnd.toISOString(),
            }
          : entry,
      ),
    );

    const response = await fetch("/api/scheduling/calendar/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        action: "reschedule",
        startAt: nextStart.toISOString(),
        endAt: nextEnd.toISOString(),
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setEvents(previous);
      setError(String(payload?.error ?? "Failed to reschedule event"));
    }
  }

  async function saveSelected() {
    if (!selected) return;
    setError(null);

    const response = await fetch("/api/scheduling/calendar/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selected.id,
        action: "update",
        title: selected.title,
        description: selected.description,
        status: selected.status,
        staffId: selected.staff_id,
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to update event"));
      return;
    }

    setEvents((current) =>
      current.map((entry) => (entry.id === selected.id ? selected : entry)),
    );
    setSelected(null);
  }

  async function createInternalEvent() {
    setError(null);
    const now = new Date();
    const start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        9,
        0,
        0,
      ),
    );
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        10,
        0,
        0,
      ),
    );

    const response = await fetch("/api/scheduling/calendar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId,
        title: "Internal planning",
        description: "New internal calendar event",
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      setError(String(payload?.error ?? "Failed to create event"));
      return;
    }

    window.location.reload();
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("month")}
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setView("week")}
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setView("day")}
            className="border-lh-border rounded border px-3 py-1 text-xs"
          >
            Day
          </button>
        </div>
        <button
          type="button"
          onClick={() => void createInternalEvent()}
          className="bg-lh-accent text-lh-on-accent rounded px-3 py-1 text-xs"
        >
          Create event
        </button>
      </div>

      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      <div
        className={`grid gap-2 ${view === "day" ? "grid-cols-1" : view === "week" ? "grid-cols-7" : "grid-cols-4"}`}
      >
        {keys.map((key) => {
          const items = grouped.get(key) ?? [];
          return (
            <div
              key={key}
              className="border-lh-border rounded border p-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const eventId = Number(
                  event.dataTransfer.getData("text/plain"),
                );
                if (Number.isFinite(eventId) && eventId > 0) {
                  void moveEvent(eventId, key);
                }
              }}
            >
              <p className="mb-2 text-xs font-semibold">{key}</p>
              <div className="space-y-2">
                {items.map((event) => (
                  <article
                    key={event.id}
                    draggable
                    onDragStart={(dragEvent) =>
                      dragEvent.dataTransfer.setData(
                        "text/plain",
                        String(event.id),
                      )
                    }
                    onClick={() => setSelected(event)}
                    className="border-lh-border bg-lh-surface cursor-pointer rounded border p-2 text-xs"
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-lh-muted">
                      {new Date(event.start_at).toLocaleTimeString()} -{" "}
                      {new Date(event.end_at).toLocaleTimeString()}
                    </p>
                    <p className="text-lh-muted">Status: {event.status}</p>
                    <p className="text-lh-muted">
                      Booking: {event.booking_id ?? "-"}
                    </p>
                    <p className="text-lh-muted">
                      Staff: {event.staff_id ?? "-"}
                    </p>
                  </article>
                ))}
                {items.length === 0 && (
                  <p className="border-lh-border text-lh-muted rounded border border-dashed p-2 text-xs">
                    Drop event here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="card space-y-2">
          <h3 className="text-sm font-semibold">Edit Event #{selected.id}</h3>
          <input
            value={selected.title}
            onChange={(event) =>
              setSelected({ ...selected, title: event.target.value })
            }
            className="border-lh-border w-full rounded border px-2 py-1 text-sm"
          />
          <textarea
            value={selected.description ?? ""}
            onChange={(event) =>
              setSelected({ ...selected, description: event.target.value })
            }
            className="border-lh-border w-full rounded border px-2 py-1 text-sm"
            rows={3}
          />
          <select
            value={selected.status}
            onChange={(event) =>
              setSelected({
                ...selected,
                status: event.target.value as CalendarEvent["status"],
              })
            }
            className="border-lh-border rounded border px-2 py-1 text-sm"
          >
            <option value="scheduled">scheduled</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void saveSelected()}
              className="bg-lh-accent text-lh-on-accent rounded px-3 py-1 text-xs"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="border-lh-border rounded border px-3 py-1 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
