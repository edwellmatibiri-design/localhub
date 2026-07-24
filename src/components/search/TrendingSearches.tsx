"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TrendingRow = {
  keyword: string;
  score: number;
};

type Props = {
  title?: string;
  filterContains?: string;
};

export default function TrendingSearches({
  title = "Trending Searches",
  filterContains,
}: Props) {
  const [rows, setRows] = useState<TrendingRow[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/search/trending", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        setRows([]);
        return;
      }
      setRows((payload?.trending ?? []) as TrendingRow[]);
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!filterContains) return rows;
    const probe = filterContains.toLowerCase();
    return rows.filter((row) => row.keyword.toLowerCase().includes(probe));
  }, [filterContains, rows]);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {filtered.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No trending keywords yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {filtered.slice(0, 12).map((item) => (
            <Link
              key={item.keyword}
              href={`/search?keyword=${encodeURIComponent(item.keyword)}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{item.keyword}</p>
              <p className="text-lh-muted mt-1 text-xs">
                Trend score: {item.score}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
