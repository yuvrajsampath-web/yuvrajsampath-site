"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createMedia, updateMedia } from "@/lib/portal-data";
import type { MediaEntry, MediaKind } from "@/lib/types";
import { PORTAL_PATH } from "@/lib/portal-config";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function MediaForm({ initial, mediaId }: { initial?: MediaEntry; mediaId?: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<MediaKind>(initial?.kind ?? "video");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [publishedAt, setPublishedAt] = useState(initial?.publishedAt ?? today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { kind, title, url, publishedAt, ...(description ? { description } : {}) };
      if (mediaId) {
        await updateMedia(mediaId, payload);
      } else {
        await createMedia(payload);
      }
      router.push(`/${PORTAL_PATH}`);
    } catch (err) {
      console.error("Failed to save media:", err);
      setError("Couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm mb-1 text-muted">Type</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as MediaKind)}
          className="rounded-md border border-line bg-surface px-3 py-2"
        >
          <option value="video">Video</option>
          <option value="podcast">Podcast</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1 text-muted">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-line bg-surface px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 text-muted">Link (YouTube or Spotify)</label>
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-md border border-line bg-surface px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 text-muted">Description (optional)</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-line bg-surface px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 text-muted">Date</label>
        <input
          type="date"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-amber text-amber-ink font-medium px-6 py-2 disabled:opacity-60"
      >
        {saving ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
