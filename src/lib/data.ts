import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Firestore } from "firebase-admin/firestore";
import { CATEGORY_BY_SLUG, type CategorySlug } from "./categories";
import { stripHtml } from "./format";
import type { Book, GalleryPhoto, MediaEntry, Writing } from "./types";
import { MOCK_BOOKS, MOCK_GALLERY, MOCK_MEDIA, MOCK_WRITINGS } from "./mock-data";

function hasAdminCredentials() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Until a real Firebase project is connected (see README), every read below
 * falls back to local mock data so the site is fully browsable in dev/preview.
 * Once FIREBASE_* env vars are set, it reads from Firestore via the Admin SDK.
 */
async function withAdmin<T>(fallback: T, fn: (db: Firestore) => Promise<T>): Promise<T> {
  if (!hasAdminCredentials()) return fallback;
  const { getAdminDb } = await import("./firebase/admin");
  try {
    return await fn(getAdminDb());
  } catch (err) {
    console.error("Firestore read failed, falling back to mock data:", err);
    return fallback;
  }
}

/**
 * Wrapped in React's cache() so generateMetadata and the page component
 * (which often need the same data) share one Firestore read per request
 * instead of fetching twice.
 */
export const getLatestDaily = cache(async (): Promise<Writing | null> => {
  const fallback = MOCK_WRITINGS.filter((w) => w.category === "daily").sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  )[0] ?? null;

  return withAdmin(fallback, async (db) => {
    const snap = await db
      .collection("writings")
      .where("category", "==", "daily")
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get();
    if (snap.empty) return fallback;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Writing;
  });
});

export const getArchive = cache(async (category: CategorySlug): Promise<Writing[]> => {
  const fallback = MOCK_WRITINGS.filter((w) => w.category === category).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  return withAdmin(fallback, async (db) => {
    const snap = await db
      .collection("writings")
      .where("category", "==", category)
      .orderBy("publishedAt", "desc")
      .get();
    // An empty result here is a real, valid state (category has no entries
    // yet) rather than "not connected" — don't fall back to mock data on
    // empty (see getBooks()).
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Writing);
  });
});

/**
 * The newest `max` entries of one category — for previews that only show the
 * first few, so they don't pay for a whole archive read (see getArchive()).
 */
export const getRecentByCategory = cache(
  async (category: CategorySlug, max: number): Promise<Writing[]> => {
    const fallback = MOCK_WRITINGS.filter((w) => w.category === category)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, max);

    return withAdmin(fallback, async (db) => {
      const snap = await db
        .collection("writings")
        .where("category", "==", category)
        .orderBy("publishedAt", "desc")
        .limit(max)
        .get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Writing);
    });
  }
);

/** One month's entries ("YYYY-MM") — avoids reading the whole archive to filter it. */
export const getByMonth = cache(
  async (category: CategorySlug, monthKey: string): Promise<Writing[]> => {
    const fallback = MOCK_WRITINGS.filter(
      (w) => w.category === category && w.publishedAt.startsWith(monthKey)
    ).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    return withAdmin(fallback, async (db) => {
      const snap = await db
        .collection("writings")
        .where("category", "==", category)
        .where("publishedAt", ">=", monthKey)
        .where("publishedAt", "<", `${monthKey}`)
        .orderBy("publishedAt", "desc")
        .get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Writing);
    });
  }
);

export type MonthCount = { monthKey: string; count: number };

/**
 * Entries per month ("YYYY-MM"), newest month first — for the paginated
 * archive index. Uses one count() aggregation per month (~1 read each)
 * rather than reading every document just to bucket them.
 */
export const getMonthCounts = cache(async (category: CategorySlug): Promise<MonthCount[]> => {
  const counts = new Map<string, number>();
  for (const w of MOCK_WRITINGS) {
    if (w.category !== category) continue;
    const key = w.publishedAt.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const fallback = Array.from(counts, ([monthKey, count]) => ({ monthKey, count })).sort((a, b) =>
    b.monthKey.localeCompare(a.monthKey)
  );

  return withAdmin(fallback, async (db) => {
    const inCategory = () => db.collection("writings").where("category", "==", category);
    const [newest, oldest] = await Promise.all([
      inCategory().orderBy("publishedAt", "desc").limit(1).get(),
      inCategory().orderBy("publishedAt", "asc").limit(1).get(),
    ]);
    if (newest.empty || oldest.empty) return [];

    const first = (oldest.docs[0].data().publishedAt as string).slice(0, 7);
    const last = (newest.docs[0].data().publishedAt as string).slice(0, 7);
    const keys: string[] = [];
    let [y, m] = first.split("-").map(Number);
    const [lastY, lastM] = last.split("-").map(Number);
    while (y < lastY || (y === lastY && m <= lastM)) {
      keys.push(`${y}-${String(m).padStart(2, "0")}`);
      if (++m > 12) {
        m = 1;
        y++;
      }
    }

    const results = await Promise.all(
      keys.map((k) =>
        inCategory()
          .where("publishedAt", ">=", k)
          .where("publishedAt", "<", `${k}\uf8ff`)
          .count()
          .get()
      )
    );
    return keys
      .map((monthKey, i) => ({ monthKey, count: results[i].data().count }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  });
});

export type WritingWithNeighbors = {
  writing: Writing;
  newer: Pick<Writing, "id" | "publishedAt"> | null;
  older: Pick<Writing, "id" | "publishedAt"> | null;
};

/**
 * One entry plus its adjacent entries in the category's newest-first order
 * (the same order getArchive() returns), at ~3 reads instead of the whole
 * archive. Neighbors are found with a cursor on the entry's own snapshot so
 * entries sharing a publishedAt keep the same order as the full list.
 */
export const getWritingWithNeighbors = cache(
  async (category: CategorySlug, id: string): Promise<WritingWithNeighbors | null> => {
    const sorted = MOCK_WRITINGS.filter((w) => w.category === category).sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    );
    const i = sorted.findIndex((w) => w.id === id);
    const fallback: WritingWithNeighbors | null =
      i === -1 ? null : { writing: sorted[i], newer: sorted[i - 1] ?? null, older: sorted[i + 1] ?? null };

    return withAdmin(fallback, async (db) => {
      const doc = await db.collection("writings").doc(id).get();
      if (!doc.exists || doc.data()?.category !== category) return null;
      const writing = { id: doc.id, ...doc.data() } as Writing;

      // The ascending query needs its own composite index (category,
      // publishedAt ASC). If it's missing or still building, drop only the
      // "newer" link rather than failing the whole page into the mock fallback.
      const [newerSnap, olderSnap] = await Promise.all([
        db
          .collection("writings")
          .where("category", "==", category)
          .orderBy("publishedAt", "asc")
          .startAfter(doc)
          .limit(1)
          .get()
          .catch((err) => {
            console.error("Newer-neighbor query failed:", err);
            return null;
          }),
        db
          .collection("writings")
          .where("category", "==", category)
          .orderBy("publishedAt", "desc")
          .startAfter(doc)
          .limit(1)
          .get(),
      ]);
      const pick = (s: typeof olderSnap | null) =>
        !s || s.empty ? null : { id: s.docs[0].id, publishedAt: s.docs[0].data().publishedAt as string };
      return { writing, newer: pick(newerSnap), older: pick(olderSnap) };
    });
  }
);

export const getWriting = cache(async (id: string): Promise<Writing | null> => {
  const fallback = MOCK_WRITINGS.find((w) => w.id === id) ?? null;

  return withAdmin(fallback, async (db) => {
    const doc = await db.collection("writings").doc(id).get();
    if (!doc.exists) return fallback;
    return { id: doc.id, ...doc.data() } as Writing;
  });
});

// Only entries that actually carry a topic are read (a plain `topic > ""`
// range on the automatic single-field index), instead of the whole archive.
const getTopicTagged = cache(async (category: CategorySlug): Promise<Writing[]> => {
  const fallback = MOCK_WRITINGS.filter((w) => w.category === category && w.topic);

  return withAdmin(fallback, async (db) => {
    const snap = await db.collection("writings").where("topic", ">", "").get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Writing)
      .filter((w) => w.category === category)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  });
});

export const getTopics = cache(async (category: CategorySlug): Promise<string[]> => {
  const tagged = await getTopicTagged(category);
  return Array.from(new Set(tagged.map((w) => w.topic).filter((t): t is string => Boolean(t)))).sort();
});

export const getByTopic = cache(async (category: CategorySlug, topic: string): Promise<Writing[]> => {
  const tagged = await getTopicTagged(category);
  return tagged.filter((w) => w.topic === topic);
});

export const getRecentWritings = cache(async (max: number): Promise<Writing[]> => {
  const fallback = [...MOCK_WRITINGS]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, max);

  return withAdmin(fallback, async (db) => {
    const snap = await db.collection("writings").orderBy("publishedAt", "desc").limit(max).get();
    if (snap.empty) return fallback;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Writing);
  });
});

export const getAllWritings = cache(async (): Promise<Writing[]> => {
  const fallback = [...MOCK_WRITINGS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return withAdmin(fallback, async (db) => {
    const snap = await db.collection("writings").orderBy("publishedAt", "desc").get();
    if (snap.empty) return fallback;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Writing);
  });
});

export type SearchableWriting = {
  id: string;
  category: CategorySlug;
  title: string;
  snippet: string;
  publishedAt: string;
};

function toSearchable(w: Writing): SearchableWriting | null {
  const def = CATEGORY_BY_SLUG[w.category];
  if (!def) return null;
  const plain = def.format === "rich" ? stripHtml(w.body) : w.body;
  return {
    id: w.id,
    category: w.category,
    title: def.hasTitle && w.title ? w.title : "",
    snippet: plain.slice(0, 200),
    publishedAt: w.publishedAt,
  };
}

// Search needs every document's text, so it is the one read that can't be
// narrowed — cache it across requests instead. Only the trimmed snippets are
// stored (well under the cache's per-entry size limit). Errors throw so a
// failed read is never cached; the caller falls back to mock data instead.
// New posts can lag in search by up to the revalidate window.
const loadSearchable = unstable_cache(
  async (): Promise<SearchableWriting[]> => {
    const { getAdminDb } = await import("./firebase/admin");
    const snap = await getAdminDb().collection("writings").orderBy("publishedAt", "desc").get();
    return snap.docs
      .map((d) => toSearchable({ id: d.id, ...d.data() } as Writing))
      .filter((w): w is SearchableWriting => w !== null);
  },
  ["searchable-writings"],
  { revalidate: 3600 }
);

export const getSearchableWritings = cache(async (): Promise<SearchableWriting[]> => {
  const fallback = [...MOCK_WRITINGS]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map(toSearchable)
    .filter((w): w is SearchableWriting => w !== null);
  if (!hasAdminCredentials()) return fallback;
  try {
    const items = await loadSearchable();
    return items.length ? items : fallback;
  } catch (err) {
    console.error("Search read failed, falling back to mock data:", err);
    return fallback;
  }
});

export const getMedia = cache(async (): Promise<MediaEntry[]> => {
  const fallback = [...MOCK_MEDIA].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return withAdmin(fallback, async (db) => {
    const snap = await db.collection("media").orderBy("publishedAt", "desc").get();
    if (snap.empty) return fallback;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MediaEntry);
  });
});

// Books are generated by scripts/generate-books.mjs, not authored via the
// portal, so unlike Writing/MediaEntry there's no create/update path here.
export const getBooks = cache(async (): Promise<Book[]> => {
  const fallback = [...MOCK_BOOKS].sort((a, b) => a.order - b.order);

  return withAdmin(fallback, async (db) => {
    const snap = await db.collection("books").orderBy("order", "asc").get();
    // Unlike the other get* functions above, an empty result here is a real,
    // valid state (no books curated/generated yet) rather than "not
    // connected" — don't fall back to mock data on empty.
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Book);
  });
});

export const getGalleryPhotos = cache(async (): Promise<GalleryPhoto[]> => {
  const fallback = [...MOCK_GALLERY].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return withAdmin(fallback, async (db) => {
    const snap = await db.collection("gallery").orderBy("publishedAt", "desc").get();
    // Same as getBooks()/getArchive(): an empty result is a real, valid state
    // (no photos added yet), not "not connected" — don't fall back to mock.
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryPhoto);
  });
});
