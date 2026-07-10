"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase/client";
import type { MediaEntry, Writing } from "./types";

const writingsCol = () => collection(db, "writings");
const mediaCol = () => collection(db, "media");

export async function listWritings(): Promise<Writing[]> {
  const snap = await getDocs(query(writingsCol(), orderBy("publishedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Writing);
}

export async function getWritingById(id: string): Promise<Writing | null> {
  const snap = await getDoc(doc(writingsCol(), id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Writing) : null;
}

export async function createWriting(data: Omit<Writing, "id" | "createdAt">) {
  await addDoc(writingsCol(), { ...data, createdAt: serverTimestamp() });
}

export async function updateWriting(id: string, data: Partial<Omit<Writing, "id">>) {
  await updateDoc(doc(writingsCol(), id), data);
}

export async function deleteWriting(id: string) {
  await deleteDoc(doc(writingsCol(), id));
}

export async function listMedia(): Promise<MediaEntry[]> {
  const snap = await getDocs(query(mediaCol(), orderBy("publishedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MediaEntry);
}

export async function getMediaById(id: string): Promise<MediaEntry | null> {
  const snap = await getDoc(doc(mediaCol(), id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as MediaEntry) : null;
}

export async function createMedia(data: Omit<MediaEntry, "id">) {
  await addDoc(mediaCol(), data);
}

export async function updateMedia(id: string, data: Partial<Omit<MediaEntry, "id">>) {
  await updateDoc(doc(mediaCol(), id), data);
}

export async function deleteMedia(id: string) {
  await deleteDoc(doc(mediaCol(), id));
}
