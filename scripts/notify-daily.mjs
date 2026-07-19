// Daily digest: haiku only. Checks for "daily" category writings published
// since the last run and emails the subscriber list via Resend.
// Run by .github/workflows/notify-subscribers.yml (the "0 16 * * *" schedule).
//
// Everything else (poetry, essays, stories, media) is skipped here and
// rolled into the weekly recap instead — see scripts/notify-weekly.mjs.
//
// The "since last run" cursor lives in Firestore (meta/dailyNotifications
// .lastNotifiedAt) rather than createdAt on individual docs, specifically so
// a one-off bulk import (like the chat-history backfill) never triggers a
// flood of emails: the cursor only advances forward from whenever this
// script first ran.
import { Timestamp } from "firebase-admin/firestore";
import {
  requireEnv,
  initFirestore,
  removeStaleSubscribers,
  headingFor,
  entryRowHtml,
  sendDigest,
} from "./lib/notify-common.mjs";

const env = requireEnv([
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
]);
const db = initFirestore(env);

async function main() {
  const cursorRef = db.collection("meta").doc("dailyNotifications");
  const cursorDoc = await cursorRef.get();

  if (!cursorDoc.exists) {
    await cursorRef.set({ lastNotifiedAt: Timestamp.now() });
    console.log("First run — cursor initialized to now, no email sent.");
    return;
  }

  await removeStaleSubscribers(db);

  const lastNotifiedAt = cursorDoc.data().lastNotifiedAt;

  const snap = await db
    .collection("writings")
    .where("category", "==", "daily")
    .where("createdAt", ">", lastNotifiedAt)
    .orderBy("createdAt", "asc")
    .get();

  if (snap.empty) {
    console.log("No new haiku since last run.");
    return;
  }

  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const latestCreatedAt = entries[entries.length - 1].createdAt;
  console.log(`${entries.length} new haiku to notify about.`);

  const itemsHtml = entries.map(entryRowHtml).join("");
  const subject =
    entries.length === 1 ? headingFor(entries[0]) : `${entries.length} new haiku today`;

  await sendDigest(db, { env, subject, itemsHtml });

  await cursorRef.set({ lastNotifiedAt: latestCreatedAt });
}

await main();
