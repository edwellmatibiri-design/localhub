"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AutoSuggest from "@/components/search/AutoSuggest";

type Props = {
  keyword?: string;
  loading?: boolean;
  onKeywordChange?: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
};

export default function SearchBar({
  keyword,
  loading = false,
  onKeywordChange,
  onSearch,
  placeholder,
}: Props) {
  const router = useRouter();
  const [internalKeyword, setInternalKeyword] = useState(keyword ?? "");

  const value = useMemo(
    () => (onKeywordChange ? (keyword ?? "") : internalKeyword),
    [internalKeyword, keyword, onKeywordChange],
  );

  function submit() {
    const normalized = String(value ?? "").trim();
    if (!normalized) {
      return;
    }

    if (onSearch) {
      onSearch();
      return;
    }

    router.push(`/search?keyword=${encodeURIComponent(normalized)}`);
  }

  function change(nextValue: string) {
    if (onKeywordChange) {
      onKeywordChange(nextValue);
      return;
    }

    setInternalKeyword(nextValue);
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold">Search LocalHub</h2>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <AutoSuggest
          value={value}
          onChange={change}
          onSubmit={submit}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
    </div>
  );
}
