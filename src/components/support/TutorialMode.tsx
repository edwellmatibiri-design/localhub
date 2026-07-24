"use client";

import { useMemo, useState } from "react";
import { generateTutorial } from "@/lib/support/agents/tutorialAgent";

export function TutorialMode() {
  const [topic, setTopic] = useState("send quote");
  const steps = useMemo(
    () => generateTutorial(topic.toLowerCase().trim()),
    [topic],
  );

  return (
    <div className="border-lh-border bg-lh-surface mx-auto max-w-xl rounded-xl border p-6">
      <h2 className="mb-2 text-xl font-semibold">Tutorial Mode</h2>
      <p className="text-lh-text-secondary mb-4 text-sm">
        Enter a support task to get guided steps.
      </p>

      <input
        className="mb-4 w-full rounded-xl border p-3"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. send quote"
      />

      <ul className="space-y-2 text-sm">
        {steps.map((step, idx) => (
          <li
            key={`${step}-${idx}`}
            className="bg-lh-surface-soft rounded-lg p-2"
          >
            {idx + 1}. {step}
          </li>
        ))}
      </ul>
    </div>
  );
}
