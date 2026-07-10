import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import type { CategorySlug } from "./categories";
import type { MediaEntry, Writing } from "./types";
import { MOCK_MEDIA, MOCK_WRITINGS } from "./mock-data";

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

export async function getLatestDaily(): Promise<Writing | null> {
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
}

export async function getArchive(category: CategorySlug): Promise<Writing[]> {
  const fallback = MOCK_WRITINGS.filter((w) => w.category === category).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  return withAdmin(fallback, async (db) => {
    const snap = await db
      .collection("writings")
      .where("category", "==", category)
      .orderBy("publishedAt", "desc")
      .get();
    if (snap.empty) return fallback;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Writing);
  });
}

export async function getWriting(id: string): Promise<Writing | null> {
  const fallback = MOCK_WRITINGS.find((w) => w.id === id) ?? null;

  return withAdmin(fallback, async (db) => {
    const doc = await db.collection("writings").doc(id).get();
    if (!doc.exists) return fallback;
    return { id: doc.id, ...doc.data() } as Writing;
  });
}

export async function getTopics(category: CategorySlug): Promise<string[]> {
  const all = await getArchive(category);
  return Array.from(new Set(all.map((w) => w.topic).filter((t): t is string => Boolean(t)))).sort();
}

export async function getByTopic(category: CategorySlug, topic: string): Promise<Writing[]> {
  const all = await getArchive(category);
  return all.filter((w) => w.topic === topic);
}

export async function getMedia(): Promise<MediaEntry[]> {
  const fallback = [...MOCK_MEDIA].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return withAdmin(fallback, async (db) => {
    const snap = await db.collection("media").orderBy("publishedAt", "desc").get();
    if (snap.empty) return fallback;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MediaEntry);
  });
}
