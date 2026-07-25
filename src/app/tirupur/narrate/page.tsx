"use client";

import { useEffect, useMemo, useState } from "react";
import { listNarrations, listWritings } from "@/lib/portal-data";
import type { Narration, Writing } from "@/lib/types";
import { NarrationItem } from "@/components/portal/NarrationItem";

export default function NarratePage() {
  const [writings, setWritings] = useState<Writing[] | null>(null);
  const [narrations, setNarrations] = useState<Narration[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [w, n] = await Promise.all([listWritings(), listNarrations()]);
      setWritings(w.filter((x) => x.category === "daily"));
      setNarrations(n);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh();
  }, []);

  const narrationById = useMemo(() => new Map(narrations.map((n) => [n.id, n])), [narrations]);

  const filtered = useMemo(() => {
    if (!writings) return null;
    const q = filter.trim().toLowerCase();
    if (!q) return writings;
    return writings.filter((w) => w.body.toLowerCase().includes(q));
  }, [writings, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">நாகணவாய் — Narrate</h1>
        <p className="text-sm text-muted mt-1">
          Record yourself reading a குறிஞ்சிட்டு entry, or delete ones you don&apos;t want to
          keep.
        </p>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by text…"
        className="w-full rounded-md border border-line bg-surface px-3 py-2"
      />

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Couldn&apos;t load entries: {error}
        </p>
      )}
      {!error && filtered === null && <p className="text-muted">Loading…</p>}
      {!error && filtered?.length === 0 && <p className="text-muted">No entries match.</p>}

      <ul className="divide-y divide-line border-t border-b border-line">
        {filtered?.map((w) => (
          <NarrationItem key={w.id} writing={w} narration={narrationById.get(w.id)} onChange={refresh} />
        ))}
      </ul>
    </div>
  );
}
