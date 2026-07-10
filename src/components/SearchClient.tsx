"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { CATEGORY_BY_SLUG } from "@/lib/categories";
import { formatDate } from "@/lib/format";

export interface SearchItem {
  id: string;
  category: keyof typeof CATEGORY_BY_SLUG;
  title: string;
  snippet: string;
  publishedAt: string;
}

export function SearchClient({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "snippet"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [items]
  );

  const results = query.trim() ? fuse.search(query).map((r) => r.item).slice(0, 40) : [];

  return (
    <div>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search everything written so far…"
        className="w-full rounded-md border border-line bg-surface px-4 py-3 text-lg font-tamil-body outline-none focus:border-amber"
      />

      {query.trim() && (
        <p className="mt-4 text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"}
        </p>
      )}

      <ol className="mt-4 divide-y divide-line border-t border-line">
        {results.map((item) => {
          const def = CATEGORY_BY_SLUG[item.category];
          return (
            <li key={`${item.category}-${item.id}`} className="py-5">
              <Link href={`/${item.category}/${item.id}`} className="group block">
                <p className="text-xs tracking-[0.15em] uppercase text-muted tabular-nums">
                  {def.english} · {formatDate(item.publishedAt)}
                </p>
                {item.title ? (
                  <p className="mt-1 font-display text-lg group-hover:text-amber transition-colors">
                    {item.title}
                  </p>
                ) : (
                  <p className="mt-1 font-tamil-body group-hover:text-amber transition-colors">
                    {item.snippet}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
