import type { CategorySlug } from "./categories";

export interface Writing {
  id: string;
  category: CategorySlug;
  title: string;
  /** HTML (from the portal's rich editor) for "rich" categories, plain text (line breaks preserved) for "plain" ones. */
  body: string;
  englishTranslation?: string;
  topic?: string;
  language: "ta" | "en";
  coverImageUrl?: string;
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
