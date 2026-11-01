import "server-only";
import { cache } from "react";
import type { Firestore } from "firebase-admin/firestore";
import type { CategorySlug } from "./categories";
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

      const [newerSnap, olderSnap] = await Promise.all([
        db
          .collection("writings")
          .where("category", "==", category)
          .orderBy("publishedAt", "asc")
          .startAfter(doc)
          .limit(1)
          .get(),
        db
          .collection("writings")
          .where("category", "==", category)
          .orderBy("publishedAt", "desc")
          .startAfter(doc)
          .limit(1)
          .get(),
      ]);
      const pick = (s: typeof newerSnap) =>
        s.empty ? null : { id: s.docs[0].id, publishedAt: s.docs[0].data().publishedAt as string };
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

export const getTopics = cache(async (category: CategorySlug): Promise<string[]> => {
  const all = await getArchive(category);
  return Array.from(new Set(all.map((w) => w.topic).filter((t): t is string => Boolean(t)))).sort();
});

export const getByTopic = cache(async (category: CategorySlug, topic: string): Promise<Writing[]> => {
  const all = await getArchive(category);
  return all.filter((w) => w.topic === topic);
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
