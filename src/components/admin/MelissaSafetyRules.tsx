"use client";

import { useState } from "react";

type SafetyRule = {
  actionType: string;
  enabled: boolean;
};

export function MelissaSafetyRules({
  initialRules,
}: {
  initialRules: SafetyRule[];
}) {
  const [rules, setRules] = useState<SafetyRule[]>(initialRules);
  const [saving, setSaving] = useState<string | null>(null);

  async function toggleRule(actionType: string, enabled: boolean) {
    setSaving(actionType);

    const previous = rules;
    setRules((current) =>
      current.map((rule) =>
        rule.actionType === actionType ? { ...rule, enabled } : rule,
      ),
    );

    const res = await fetch("/api/admin/melissa/safety", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType, enabled }),
    });

    if (!res.ok) {
      setRules(previous);
    }

    setSaving(null);
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <label
          key={rule.actionType}
          className="border-lh-border bg-lh-surface flex items-center justify-between rounded-lg border p-3"
        >
          <span className="text-sm font-medium">{rule.actionType}</span>
          <input
            type="checkbox"
            checked={rule.enabled}
            disabled={saving === rule.actionType}
            onChange={(event) =>
              toggleRule(rule.actionType, event.target.checked)
            }
          />
        </label>
      ))}
    </div>
  );
}
