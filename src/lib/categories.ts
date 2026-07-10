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
  },
  {
    slug: "story",
    tamil: "தூவானை",
    transliteration: "Tuvanai",
    english: "Story",
    birdMeaning: "a long-necked bird that lives by the water",
    format: "rich",
    topicIndexed: false,
  },
  {
    slug: "poetry",
    tamil: "முருகு சிட்டு",
    transliteration: "Murugu Sittu",
    english: "Poetry",
    birdMeaning: "a small bird, beautiful enough for verse",
    format: "plain",
    topicIndexed: false,
  },
  {
    slug: "essay",
    tamil: "அன்னம்",
    transliteration: "Annam",
    english: "Essay",
    birdMeaning: "the freshwater bird that signifies nobility",
    format: "rich",
    topicIndexed: false,
  },
  {
    slug: "shortstory",
    tamil: "சிறு மயில்",
    transliteration: "Siru Mayil",
    english: "Short Story",
    birdMeaning: "the small peacock — beauty and youth",
    format: "rich",
    topicIndexed: false,
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
) as Record<CategorySlug, CategoryDef>;

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORY_BY_SLUG;
}
