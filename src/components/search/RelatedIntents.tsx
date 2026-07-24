"use client";

import Link from "next/link";

type RelatedIntent = {
  id: string;
  keyword: string;
  intent: string;
  landing_path: string;
};

type Props = {
  intents: RelatedIntent[];
};

export default function RelatedIntents({ intents }: Props) {
  return (
    <section className="card space-y-3">
      <h3 className="text-base font-semibold">Related Searches</h3>
      {intents.length === 0 ? (
        <p className="text-lh-muted text-sm">No related intents found.</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {intents.map((item) => (
            <li
              key={item.id}
              className="border-lh-border rounded-lg border px-3 py-2"
            >
              <p className="font-medium">
                <Link
                  href={`/search?keyword=${encodeURIComponent(item.keyword)}`}
                  className="text-lh-accent hover:underline"
                >
                  {item.keyword}
                </Link>
              </p>
              <p className="text-lh-muted text-xs">Intent: {item.intent}</p>
              <p className="text-lh-muted text-xs">{item.landing_path}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
