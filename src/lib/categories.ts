export type CategorySlug = "daily" | "story" | "poetry" | "essay" | "shortstory";

export type ContentFormat = "plain" | "rich";

export interface CategoryDef {
  slug: CategorySlug;
  tamil: string;
  transliteration: string;
  english: string;
  birdMeaning: string;
  format: ContentFormat;
  /** Whether entries in this category get a topic index in addition to the chronological archive. */
  topicIndexed: boolean;
  /** Whether entries in this category have a title (daily entries don't — the text itself is the entry). */
  hasTitle: boolean;
  /** Whether the archive is split into year/month sub-pages instead of one long list (daily grows fastest). */
  paginated: boolean;
}

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: string): boolean {
  return MONTH_KEY_RE.test(value);
}

export function monthKeyLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "daily",
    tamil: "குறிஞ்சிட்டு",
    transliteration: "Kurinjittu",
    english: "Daily",
    birdMeaning: "a small mountain bird with a soft voice — the day's short piece",
    format: "plain",
    topicIndexed: true,
    hasTitle: false,
    paginated: true,
  },
  {
    slug: "story",
    tamil: "தூவானை",
    transliteration: "Tuvanai",
    english: "Story",
    birdMeaning: "a long-necked bird that lives by the water",
    format: "rich",
    topicIndexed: false,
    hasTitle: true,
    paginated: false,
  },
  {
    slug: "poetry",
    tamil: "முருகு சிட்டு",
    transliteration: "Murugu Sittu",
    english: "Poetry",
    birdMeaning: "a small bird, beautiful enough for verse",
    format: "plain",
    topicIndexed: false,
    hasTitle: true,
    paginated: false,
  },
  {
    slug: "essay",
    tamil: "அன்னம்",
    transliteration: "Annam",
    english: "Essay",
    birdMeaning: "the freshwater bird that signifies nobility",
    format: "rich",
    topicIndexed: false,
    hasTitle: true,
    paginated: false,
  },
  {
    slug: "shortstory",
    tamil: "சிறு மயில்",
    transliteration: "Siru Mayil",
    english: "Short Story",
    birdMeaning: "the small peacock — beauty and youth",
    format: "rich",
    topicIndexed: false,
    hasTitle: true,
    paginated: false,
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
) as Record<CategorySlug, CategoryDef>;

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORY_BY_SLUG;
}
