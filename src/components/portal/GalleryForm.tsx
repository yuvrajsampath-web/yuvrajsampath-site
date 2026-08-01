"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { createGalleryPhoto, updateGalleryPhoto } from "@/lib/portal-data";
import type { GalleryPhoto } from "@/lib/types";
import { PORTAL_PATH } from "@/lib/portal-config";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function GalleryForm({ initial, photoId }: { initial?: GalleryPhoto; photoId?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [publishedAt, setPublishedAt] = useState(initial?.publishedAt ?? today());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = `gallery/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      setImageUrl(await getDownloadURL(storageRef));
    } catch {
      setError("Photo upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!imageUrl) {
      setError("Upload a photo first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { imageUrl, caption, publishedAt };
      if (photoId) {
        await updateGalleryPhoto(photoId, payload);
      } else {
        await createGalleryPhoto(payload);
      }
      router.push(`/${PORTAL_PATH}`);
    } catch (err) {
      console.error("Failed to save gallery photo:", err);
      setError("Couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm mb-1 text-muted">Photo</label>
        <input ref={fileInput} type="file" accept="image/*" onChange={handleFileChange} />
        {uploading && <p className="text-sm text-muted mt-1">Uploading…</p>}
        {imageUrl && !uploading && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="mt-2 h-32 rounded-md border border-line" />
        )}
      </div>
      <div>
        <label className="block text-sm mb-1 text-muted">Caption</label>
        <input
          required
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
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
        disabled={saving || uploading}
        className="rounded-md bg-amber text-amber-ink font-medium px-6 py-2 disabled:opacity-60"
      >
        {saving ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
