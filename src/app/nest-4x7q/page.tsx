"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import type { MediaEntry, Writing } from "@/lib/types";
import { deleteMedia, deleteWriting, listMedia, listWritings } from "@/lib/portal-data";
import { PORTAL_PATH } from "@/lib/portal-config";

type Tab = CategorySlug | "media";

export default function PortalDashboard() {
  const [writings, setWritings] = useState<Writing[] | null>(null);
  const [media, setMedia] = useState<MediaEntry[] | null>(null);
  const [tab, setTab] = useState<Tab>("daily");

  async function refresh() {
    const [w, m] = await Promise.all([listWritings(), listMedia()]);
    setWritings(w);
    setMedia(m);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh();
  }, []);

  async function handleDeleteWriting(w: Writing) {
    if (!confirm(`Delete "${w.title ?? w.body.slice(0, 40)}"? This can't be undone.`)) return;
    await deleteWriting(w.id);
    refresh();
  }

  async function handleDeleteMedia(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    await deleteMedia(id);
    refresh();
  }

  const shownWritings = writings?.filter((w) => w.category === tab) ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/${PORTAL_PATH}/writings/new?category=${c.slug}`}
            className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-amber hover:text-amber transition-colors"
          >
            + {c.tamil}
          </Link>
        ))}
        <Link
          href={`/${PORTAL_PATH}/media/new`}
          className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-amber hover:text-amber transition-colors"
        >
          + Podcast / Video
        </Link>
      </div>

      <nav className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setTab(c.slug)}
            className={
              "pb-2 text-sm border-b-2 -mb-px transition-colors " +
              (tab === c.slug
                ? "border-amber text-amber"
                : "border-transparent text-muted hover:text-current")
            }
          >
            {c.tamil}
          </button>
        ))}
        <button
          onClick={() => setTab("media")}
          className={
            "pb-2 text-sm border-b-2 -mb-px transition-colors " +
            (tab === "media"
              ? "border-amber text-amber"
              : "border-transparent text-muted hover:text-current")
          }
        >
          Podcasts &amp; Videos
        </button>
      </nav>

      {tab !== "media" ? (
        <section>
          {shownWritings === null && <p className="text-muted">Loading…</p>}
          {shownWritings?.length === 0 && <p className="text-muted">Nothing published yet.</p>}
          <ul className="divide-y divide-line border-t border-b border-line">
            {shownWritings?.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted">{w.publishedAt}</p>
                  {w.title ? (
                    <p className="truncate font-tamil-body">{w.title}</p>
                  ) : (
                    <p className="font-tamil-body whitespace-pre-line">{w.body}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <Link
                    href={`/${PORTAL_PATH}/writings/${w.id}/edit`}
                    className="text-amber hover:opacity-75 transition-opacity"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteWriting(w)}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section>
          {media === null && <p className="text-muted">Loading…</p>}
          {media?.length === 0 && <p className="text-muted">Nothing published yet.</p>}
          <ul className="divide-y divide-line border-t border-b border-line">
            {media?.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted">
                    {m.kind} · {m.publishedAt}
                  </p>
                  <p className="truncate">{m.title}</p>
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <Link
                    href={`/${PORTAL_PATH}/media/${m.id}/edit`}
                    className="text-amber hover:opacity-75 transition-opacity"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteMedia(m.id, m.title)}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
