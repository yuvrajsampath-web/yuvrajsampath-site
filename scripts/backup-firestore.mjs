// Nightly Firestore → JSON export, run by .github/workflows/backup-firestore.yml.
// Firestore has no undo; this is the safety net for the archive (see
// docs/architecture: "Resilience & content quality").
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { mkdir, writeFile } from "node:fs/promises";

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const date = new Date().toISOString().slice(0, 10);
const outDir = new URL(`../backups/${date}/`, import.meta.url);
await mkdir(outDir, { recursive: true });

for (const collectionName of ["writings", "media"]) {
  const snap = await db.collection(collectionName).get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  await writeFile(new URL(`${collectionName}.json`, outDir), JSON.stringify(docs, null, 2));
  console.log(`${collectionName}: ${docs.length} docs`);
}
