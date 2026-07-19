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
} from "./lib/notify-common.mjs";

const env = requireEnv([
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
]);
const db = initFirestore(env);

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

async function main() {
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

  const haiku = entries.filter((w) => w.category === "daily");
  const others = entries.filter((w) => w.category !== "daily");

  console.log(
    `${haiku.length} haiku and ${others.length} other update(s) to recap this week.`
  );

  let itemsHtml = "";
  if (haiku.length) {
    itemsHtml += sectionHeaderHtml("This week's haiku") + haiku.map(entryRowHtml).join("");
  }
  if (others.length) {
    itemsHtml += sectionHeaderHtml("Also published this week") + others.map(entryRowHtml).join("");
  }

  const subject = `This week from Yuvraj Sampath — ${formatDateRange(
    lastNotifiedAt.toDate(),
    now.toDate()
  )}`;

  await sendDigest(db, {
    env,
    subject,
    itemsHtml,
    from: "Yuvraj Sampath <weekly@yuvrajsampath.com>",
  });

  await cursorRef.set({ lastNotifiedAt: latestCreatedAt });
}

await main();
