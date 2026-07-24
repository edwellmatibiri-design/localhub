"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SuggestionType = "category" | "location" | "vendor" | "listing" | "intent";

type Suggestion = {
  keyword: string;
  type: SuggestionType;
  score: number;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
};

const badgeClass: Record<SuggestionType, string> = {
  category: "bg-lh-accent-muted text-lh-accent",
  location: "bg-lh-success/20 text-lh-emerald",
  vendor: "bg-lh-warning/20 text-lh-warning",
  listing: "bg-lh-warning/20 text-lh-warning",
  intent: "bg-lh-surface-soft text-lh-text-secondary",
};

function targetPath(suggestion: Suggestion) {
  const keyword = String(suggestion.keyword ?? "").trim();
  if (suggestion.type === "category")
    return `/categories/${encodeURIComponent(keyword)}`;
  if (suggestion.type === "location")
    return `/locations/${encodeURIComponent(keyword)}`;
  if (suggestion.type === "vendor")
    return `/vendors/${encodeURIComponent(keyword.split("|")[0]?.trim() || keyword)}`;
  if (suggestion.type === "listing")
    return `/listings/${encodeURIComponent(keyword.split("|")[0]?.trim() || keyword)}`;
  return `/search?keyword=${encodeURIComponent(keyword)}`;
}

export default function AutoSuggest({
  value,
  onChange,
  onSubmit,
  placeholder,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [focused, setFocused] = useState(false);

  const visibleSuggestions = useMemo(
    () => (focused ? suggestions : []),
    [focused, suggestions],
  );

  useEffect(() => {
    const query = String(value ?? "").trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/search/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const payload = await response.json();
        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        setSuggestions((payload?.suggestions ?? []) as Suggestion[]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSubmit();
          }
        }}
        className="border-lh-border w-full rounded-lg border px-3 py-2"
        placeholder={placeholder ?? "Try: emergency plumber near me"}
      />

      {loading && (
        <p className="text-lh-muted absolute top-2 right-3 text-xs">
          Loading...
        </p>
      )}

      {visibleSuggestions.length > 0 && (
        <div className="border-lh-border bg-lh-surface absolute z-10 mt-1 w-full space-y-1 rounded-lg border p-2 shadow-lg">
          {visibleSuggestions.map((suggestion) => (
            <button
              key={`${suggestion.type}-${suggestion.keyword}`}
              type="button"
              onClick={() => {
                router.push(targetPath(suggestion));
              }}
              className="hover:bg-lh-surface-soft flex w-full items-center justify-between rounded-md px-2 py-2 text-left"
            >
              <span className="text-sm">{suggestion.keyword}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${badgeClass[suggestion.type]}`}
              >
                {suggestion.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
