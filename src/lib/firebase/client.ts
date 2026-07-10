"use client";

import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Client SDK — only ever imported from inside the hidden portal.
 * Public pages must not import this; they read through lib/data.ts (Admin SDK) instead.
 *
 * Browser-only by construction: Next.js still does a server-side render pass for
 * "use client" pages (to produce the initial HTML), which would otherwise run this
 * module with no real config and throw. Since this SDK has no reason to run on the
 * server at all, initialization is skipped there — every real call site (auth state
 * listeners, form submits) only runs inside useEffect/event handlers, which never
 * execute during SSR anyway.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);
const canInit = typeof window !== "undefined" && isFirebaseConfigured;

export const firebaseApp = (
  canInit ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : undefined
) as FirebaseApp;

export const auth = (canInit ? getAuth(firebaseApp) : undefined) as Auth;
export const db = (canInit ? getFirestore(firebaseApp) : undefined) as Firestore;
export const storage = (canInit ? getStorage(firebaseApp) : undefined) as FirebaseStorage;
