"use client";

import { useState } from "react";

type TemplateCreateFormProps = {
  vendorId: string;
};

const DEFAULT_TEMPLATES: Array<{ name: string; content: string }> = [
  {
    name: "Missed call follow-up",
    content: "Hi, we missed your call. How can we help?",
  },
  {
    name: "Quote follow-up",
    content:
      "Hi, just checking in on your quote. Let us know if you have any questions.",
  },
  {
    name: "Booking confirmation",
    content: "Your booking is confirmed. We look forward to assisting you.",
  },
  {
    name: "Thank you message",
    content: "Thank you for choosing us. We appreciate your support.",
  },
];

export default function TemplateCreateForm({
  vendorId,
}: TemplateCreateFormProps) {
  const [selectedName, setSelectedName] = useState(DEFAULT_TEMPLATES[0].name);
  const [content, setContent] = useState(DEFAULT_TEMPLATES[0].content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onNameChange(nextName: string) {
    setSelectedName(nextName);
    const preset = DEFAULT_TEMPLATES.find((item) => item.name === nextName);
    if (preset) setContent(preset.content);
  }

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/comms/templates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, name: selectedName, content }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to create template"));
      }
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create template",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card space-y-2">
      <h2 className="text-lg font-semibold">Create Template</h2>
      <label className="text-lh-muted text-xs" htmlFor="template-name">
        Template type
      </label>
      <select
        id="template-name"
        className="border-lh-border rounded border px-3 py-2 text-sm"
        value={selectedName}
        onChange={(event) => onNameChange(event.target.value)}
      >
        {DEFAULT_TEMPLATES.map((template) => (
          <option key={template.name} value={template.name}>
            {template.name}
          </option>
        ))}
      </select>

      <label className="text-lh-muted text-xs" htmlFor="template-content">
        Message content
      </label>
      <textarea
        id="template-content"
        className="border-lh-border rounded border px-3 py-2 text-sm"
        rows={4}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />

      <button
        type="button"
        onClick={() => void save()}
        disabled={loading}
        className="border-lh-border w-fit rounded border px-3 py-1 text-xs disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save template"}
      </button>
      {error && <p className="text-lh-danger text-xs">{error}</p>}
    </section>
  );
}
