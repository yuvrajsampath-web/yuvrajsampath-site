"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { CATEGORIES, CATEGORY_BY_SLUG, type CategorySlug } from "@/lib/categories";
import { createWriting, updateWriting } from "@/lib/portal-data";
import type { Writing } from "@/lib/types";
import { RichEditor } from "./RichEditor";
import { PORTAL_PATH } from "@/lib/portal-config";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function WritingForm({
  initial,
  writingId,
  defaultCategory,
}: {
  initial?: Writing;
  writingId?: string;
  defaultCategory?: CategorySlug;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<CategorySlug>(
    initial?.category ?? defaultCategory ?? "daily"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [englishTranslation, setEnglishTranslation] = useState(initial?.englishTranslation ?? "");
  const [language, setLanguage] = useState<"ta" | "en">(initial?.language ?? "ta");
  const [publishedAt, setPublishedAt] = useState(initial?.publishedAt ?? today());
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const def = CATEGORY_BY_SLUG[category];

  async function handleFileChange() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `covers/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      setCoverImageUrl(await getDownloadURL(storageRef));
    } catch {
      setError("Image upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        category,
        title,
        body,
        language,
        publishedAt,
        ...(topic ? { topic } : {}),
        ...(englishTranslation ? { englishTranslation } : {}),
        ...(coverImageUrl ? { coverImageUrl } : {}),
      };
      if (writingId) {
        await updateWriting(writingId, payload);
      } else {
        await createWriting(payload);
      }
      router.push(`/${PORTAL_PATH}`);
    } catch (err) {
      console.error("Failed to save writing:", err);
      setError("Couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm mb-1 text-muted">Section</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategorySlug)}
          className="w-full rounded-md border border-line bg-surface px-3 py-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.tamil} — {c.english}
            </option>
          ))}
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
        <label className="block text-sm mb-1 text-muted">
          {def.format === "plain" ? "Text" : "Body"}
        </label>
        {def.format === "rich" ? (
          <RichEditor value={body} onChange={setBody} />
        ) : (
          <textarea
            required
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 font-tamil-body text-lg"
          />
        )}
      </div>

      {def.slug === "daily" && (
        <div>
          <label className="block text-sm mb-1 text-muted">English translation (optional)</label>
          <textarea
            rows={3}
            value={englishTranslation}
            onChange={(e) => setEnglishTranslation(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2"
          />
        </div>
      )}

      {def.topicIndexed && (
        <div>
          <label className="block text-sm mb-1 text-muted">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2"
          />
        </div>
      )}

      {def.format === "rich" && (
        <div>
          <label className="block text-sm mb-1 text-muted">Cover image (optional)</label>
          <input ref={fileInput} type="file" accept="image/*" onChange={handleFileChange} />
          {uploading && <p className="text-sm text-muted mt-1">Uploading…</p>}
          {coverImageUrl && !uploading && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="" className="mt-2 h-24 rounded-md border border-line" />
          )}
        </div>
      )}

      <div className="flex gap-6">
        <div>
          <label className="block text-sm mb-1 text-muted">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "ta" | "en")}
            className="rounded-md border border-line bg-surface px-3 py-2"
          >
            <option value="ta">Tamil</option>
            <option value="en">English</option>
          </select>
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
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="rounded-md bg-amber text-amber-ink font-medium px-6 py-2 disabled:opacity-60"
      >
        {saving ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
