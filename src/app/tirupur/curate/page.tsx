"use client";

import { useEffect, useMemo, useState } from "react";
import { listWritings, updateWriting } from "@/lib/portal-data";
import type { Writing } from "@/lib/types";

export default function CuratePage() {
  const [writings, setWritings] = useState<Writing[] | null>(null);
  const [filter, setFilter] = useState("");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const all = await listWritings();
    setWritings(all.filter((w) => w.category === "daily"));
    setPending({});
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!writings) return null;
    const q = filter.trim().toLowerCase();
    if (!q) return writings;
    return writings.filter(
      (w) => w.body.toLowerCase().includes(q) || (w.topic ?? "").toLowerCase().includes(q)
    );
  }, [writings, filter]);

  function isChecked(w: Writing) {
    return pending[w.id] ?? w.bookIncluded ?? false;
  }

  function toggle(w: Writing) {
    setPending((p) => ({ ...p, [w.id]: !isChecked(w) }));
  }

  const selectedCount = writings?.filter((w) => isChecked(w)).length ?? 0;
  const changedIds = Object.keys(pending).filter(
    (id) => pending[id] !== (writings?.find((w) => w.id === id)?.bookIncluded ?? false)
  );

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(changedIds.map((id) => updateWriting(id, { bookIncluded: pending[id] })));
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Curate a book</h1>
        <p className="text-sm text-muted mt-1">
          Select which குறிஞ்சிட்டு entries go into the next book volume. Once you save, ask a
          developer to run the &quot;Generate books&quot; GitHub Action to compile them into a
          PDF.
        </p>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by text or topic…"
        className="w-full rounded-md border border-line bg-surface px-3 py-2"
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{selectedCount} selected for the next book</p>
        <button
          onClick={handleSave}
          disabled={saving || changedIds.length === 0}
          className="shrink-0 rounded-md bg-amber text-amber-ink font-medium px-6 py-2 disabled:opacity-60"
        >
          {saving ? "Saving…" : `Save${changedIds.length ? ` (${changedIds.length})` : ""}`}
        </button>
      </div>

      {filtered === null && <p className="text-muted">Loading…</p>}
      {filtered?.length === 0 && <p className="text-muted">No entries match.</p>}

      <ul className="divide-y divide-line border-t border-b border-line">
        {filtered?.map((w) => (
          <li key={w.id} className="flex items-start gap-4 py-3">
            <input
              type="checkbox"
              checked={isChecked(w)}
              onChange={() => toggle(w)}
              className="mt-1 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted">{w.publishedAt}</p>
              <p className="font-tamil-body whitespace-pre-line">{w.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
