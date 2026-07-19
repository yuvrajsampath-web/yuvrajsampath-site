// Weekly digest: recaps the week's haiku (already sent individually via
// notify-daily.mjs) plus everything else the author published that week
// (poetry, essays, stories, media) that the daily digest never sends.
// Run by .github/workflows/notify-subscribers.yml (the "0 16 * * 0" schedule).
//
// Cursor lives separately from the daily one (meta/weeklyNotifications
// .lastNotifiedAt) so the two cadences don't interfere with each other.
import { Timestamp } from "firebase-admin/firestore";
import {
  requireEnv,
  initFirestore,
  removeStaleSubscribers,
  entryRowHtml,
  sectionHeaderHtml,
  sendDigest,
  sendTestEmail,
} from "./lib/notify-common.mjs";

const WEEKLY_FROM = "Yuvraj Sampath <weekly@yuvrajsampath.com>";

const env = requireEnv([
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
]);
const db = initFirestore(env);
const TEST_TO = process.env.TEST_TO;

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "Asia/Kolkata",
});

function formatDateRange(start, end) {
  const startParts = DATE_FMT.formatToParts(start);
  const endParts = DATE_FMT.formatToParts(end);
  const startMonth = startParts.find((p) => p.type === "month").value;
  const endMonth = endParts.find((p) => p.type === "month").value;
  const startDay = startParts.find((p) => p.type === "day").value;
  const endDay = endParts.find((p) => p.type === "day").value;
  return startMonth === endMonth
    ? `${startMonth} ${startDay}–${endDay}`
    : `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

function buildSections(entries) {
  const haiku = entries.filter((w) => w.category === "daily");
  const others = entries.filter((w) => w.category !== "daily");
  let itemsHtml = "";
  if (haiku.length) {
    itemsHtml += sectionHeaderHtml("This week's குறிஞ்சிட்டு") + haiku.map(entryRowHtml).join("");
  }
  if (others.length) {
    itemsHtml += sectionHeaderHtml("Also published this week") + others.map(entryRowHtml).join("");
  }
  return { haiku, others, itemsHtml };
}

// TEST_TO sends a preview built from the last 7 days of content to one
// address: no cursor read/write, no subscribers collection touched.
async function runTest(to) {
  const now = Timestamp.now();
  const weekAgo = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);

  const snap = await db
    .collection("writings")
    .where("createdAt", ">", weekAgo)
    .orderBy("createdAt", "asc")
    .get();

  if (snap.empty) {
    console.log("No writings in the last 7 days to preview.");
    return;
  }

  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const { haiku, others, itemsHtml } = buildSections(entries);
  console.log(`${haiku.length} haiku and ${others.length} other update(s) in the preview.`);

  const subject = `This week from Yuvraj Sampath — ${formatDateRange(weekAgo.toDate(), now.toDate())}`;

  await sendTestEmail(db, { env, subject, itemsHtml, from: WEEKLY_FROM, to });
}

async function main() {
  if (TEST_TO) {
    await runTest(TEST_TO);
    return;
  }

  const cursorRef = db.collection("meta").doc("weeklyNotifications");
  const cursorDoc = await cursorRef.get();

  if (!cursorDoc.exists) {
    await cursorRef.set({ lastNotifiedAt: Timestamp.now() });
    console.log("First run — cursor initialized to now, no email sent.");
    return;
  }

  await removeStaleSubscribers(db);

  const lastNotifiedAt = cursorDoc.data().lastNotifiedAt;
  const now = Timestamp.now();

  const snap = await db
    .collection("writings")
    .where("createdAt", ">", lastNotifiedAt)
    .orderBy("createdAt", "asc")
    .get();

  if (snap.empty) {
    console.log("No new writings this week.");
    await cursorRef.set({ lastNotifiedAt: now });
    return;
  }

  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const latestCreatedAt = entries[entries.length - 1].createdAt;

  const { haiku, others, itemsHtml } = buildSections(entries);
  console.log(
    `${haiku.length} haiku and ${others.length} other update(s) to recap this week.`
  );

  const subject = `This week from Yuvraj Sampath — ${formatDateRange(
    lastNotifiedAt.toDate(),
    now.toDate()
  )}`;

  await sendDigest(db, { env, subject, itemsHtml, from: WEEKLY_FROM });

  await cursorRef.set({ lastNotifiedAt: latestCreatedAt });
}

await main();
