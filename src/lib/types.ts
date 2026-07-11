import type { CategorySlug } from "./categories";

export interface Writing {
  id: string;
  category: CategorySlug;
  /** Absent for categories where hasTitle is false (e.g. daily — the text itself is the entry). */
  title?: string;
  /** HTML (from the portal's rich editor) for "rich" categories, plain text (line breaks preserved) for "plain" ones. */
  body: string;
  topic?: string;
  language: "ta" | "en";
  coverImageUrl?: string;
  audioUrl?: string;
  publishedAt: string; // ISO date
  createdAt: string; // ISO datetime
}

export type MediaKind = "podcast" | "video";

export interface MediaEntry {
  id: string;
  kind: MediaKind;
  title: string;
  description?: string;
  url: string;
  publishedAt: string; // ISO date
}
