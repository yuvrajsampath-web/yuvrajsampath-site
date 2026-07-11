// Daily digest: checks for writings published since the last run and emails
// the subscriber list via Resend. Run by .github/workflows/notify-subscribers.yml.
//
// The "since last run" cursor lives in Firestore (meta/notifications.lastNotifiedAt)
// rather than createdAt on individual docs, specifically so a one-off bulk import
// (like the chat-history backfill) never triggers a flood of emails: the cursor
// only advances forward from whenever this script first ran.
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
} = process.env;

for (const [name, value] of Object.entries({
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
})) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore();

const SITE_URL = "https://yuvrajsampath.com";
const CATEGORY_LABELS = {
  daily: { tamil: "குறிஞ்சிட்டு", english: "Daily", hasTitle: false, format: "plain" },
  story: { tamil: "தூவானை", english: "Story", hasTitle: true, format: "rich" },
  poetry: { tamil: "முருகு சிட்டு", english: "Poetry", hasTitle: true, format: "plain" },
  essay: { tamil: "அன்னம்", english: "Essay", hasTitle: true, format: "rich" },
  shortstory: { tamil: "சிறு மயில்", english: "Short Story", hasTitle: true, format: "rich" },
};

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const cursorRef = db.collection("meta").doc("notifications");
  const cursorDoc = await cursorRef.get();

  if (!cursorDoc.exists) {
    await cursorRef.set({ lastNotifiedAt: Timestamp.now() });
    console.log("First run — cursor initialized to now, no email sent.");
    return;
  }

  const lastNotifiedAt = cursorDoc.data().lastNotifiedAt;

  const snap = await db
    .collection("writings")
    .where("createdAt", ">", lastNotifiedAt)
    .orderBy("createdAt", "asc")
    .get();

  if (snap.empty) {
    console.log("No new writings since last run.");
    return;
  }

  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const latestCreatedAt = entries[entries.length - 1].createdAt;
  console.log(`${entries.length} new entr${entries.length === 1 ? "y" : "ies"} to notify about.`);

  const subscribersSnap = await db.collection("subscribers").get();
  if (subscribersSnap.empty) {
    console.log("No subscribers — advancing cursor without sending anything.");
    await cursorRef.set({ lastNotifiedAt: latestCreatedAt });
    return;
  }

  const itemsHtml = entries
    .map((w) => {
      const def = CATEGORY_LABELS[w.category] ?? CATEGORY_LABELS.daily;
      const plain = def.format === "rich" ? stripHtml(w.body) : w.body;
      const heading = def.hasTitle && w.title ? w.title : plain.slice(0, 80);
      const url = `${SITE_URL}/${w.category}/${w.id}`;
      return `
        <tr><td style="padding:20px 0;border-top:1px solid #e4ddd1;">
          <p style="margin:0 0 4px;font:12px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b5d4f;">${escapeHtml(def.english)}</p>
          <p style="margin:0 0 8px;font:20px/1.4 Georgia,serif;color:#201811;">${escapeHtml(heading)}</p>
          <a href="${url}" style="font:14px system-ui,sans-serif;color:#c1652a;">Read →</a>
        </td></tr>`;
    })
    .join("");

  console.log(`Sending to ${subscribersSnap.size} subscriber(s)...`);
  let sent = 0;
  for (const sub of subscribersSnap.docs) {
    const { email, token } = sub.data();
    const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 24px;font:italic 22px Georgia,serif;color:#201811;">Yuvraj Sampath</p>
          <table role="presentation" width="100%">${itemsHtml}</table>
          <p style="margin:32px 0 0;font:12px system-ui,sans-serif;color:#6b5d4f;">
            <a href="${unsubUrl}" style="color:#6b5d4f;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject:
          entries.length === 1
            ? `New: ${CATEGORY_LABELS[entries[0].category]?.english ?? "writing"}`
            : `${entries.length} new from Yuvraj Sampath`,
        html,
      }),
    });

    if (res.ok) {
      sent++;
    } else {
      console.error(`Failed to send to ${email}: ${res.status} ${await res.text()}`);
    }
  }
  console.log(`Sent ${sent}/${subscribersSnap.size}.`);

  await cursorRef.set({ lastNotifiedAt: latestCreatedAt });
}

await main();
