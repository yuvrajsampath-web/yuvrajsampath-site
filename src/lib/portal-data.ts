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
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase/client";
import type { GalleryPhoto, MediaEntry, Narration, Writing } from "./types";

const writingsCol = () => collection(db, "writings");
const mediaCol = () => collection(db, "media");
const narrationsCol = () => collection(db, "narrations");
const galleryCol = () => collection(db, "gallery");

export async function listWritings(): Promise<Writing[]> {
  const snap = await getDocs(query(writingsCol(), orderBy("publishedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Writing);
}

export async function getWritingById(id: string): Promise<Writing | null> {
  const snap = await getDoc(doc(writingsCol(), id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Writing) : null;
}

export async function createWriting(data: Omit<Writing, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(writingsCol(), { ...data, createdAt: serverTimestamp() });
  return ref.id;
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

export async function listGallery(): Promise<GalleryPhoto[]> {
  const snap = await getDocs(query(galleryCol(), orderBy("publishedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryPhoto);
}

export async function getGalleryPhotoById(id: string): Promise<GalleryPhoto | null> {
  const snap = await getDoc(doc(galleryCol(), id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as GalleryPhoto) : null;
}

export async function createGalleryPhoto(data: Omit<GalleryPhoto, "id">) {
  await addDoc(galleryCol(), data);
}

export async function updateGalleryPhoto(id: string, data: Partial<Omit<GalleryPhoto, "id">>) {
  await updateDoc(doc(galleryCol(), id), data);
}

export async function deleteGalleryPhoto(id: string) {
  await deleteDoc(doc(galleryCol(), id));
}

export async function listNarrations(): Promise<Narration[]> {
  const snap = await getDocs(narrationsCol());
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Narration);
}

// Doc id is always the source Writing's id (one narration per haiku, at most).
export async function setNarration(id: string, data: Partial<Omit<Narration, "id">>) {
  await setDoc(doc(narrationsCol(), id), data, { merge: true });
}

export async function deleteNarration(id: string) {
  await deleteDoc(doc(narrationsCol(), id));
}
