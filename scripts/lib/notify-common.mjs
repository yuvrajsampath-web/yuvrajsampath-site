// Shared helpers for scripts/notify-daily.mjs and scripts/notify-weekly.mjs.
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const UNOPENED_LIMIT = 10;
export const SITE_URL = "https://yuvrajsampath.com";

export const CATEGORY_LABELS = {
  daily: { tamil: "குறிஞ்சிட்டு", english: "Daily", hasTitle: false, format: "plain" },
  story: { tamil: "தூவானை", english: "Story", hasTitle: true, format: "rich" },
  poetry: { tamil: "முருகு சிட்டு", english: "Poetry", hasTitle: true, format: "plain" },
  essay: { tamil: "அன்னம்", english: "Essay", hasTitle: true, format: "rich" },
  shortstory: { tamil: "சிறு மயில்", english: "Short Story", hasTitle: true, format: "rich" },
};

export function requireEnv(names) {
  const env = {};
  for (const name of names) {
    const value = process.env[name];
    if (!value) {
      console.error(`Missing required env var: ${name}`);
      process.exit(1);
    }
    env[name] = value;
  }
  return env;
}

export function initFirestore(env) {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

export function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function headingFor(w) {
  const def = CATEGORY_LABELS[w.category] ?? CATEGORY_LABELS.daily;
  const plain = def.format === "rich" ? stripHtml(w.body) : w.body;
  return def.hasTitle && w.title ? w.title : plain.slice(0, 80);
}

export function entryRowHtml(w) {
  const def = CATEGORY_LABELS[w.category] ?? CATEGORY_LABELS.daily;
  const heading = headingFor(w);
  const url = `${SITE_URL}/${w.category}/${w.id}`;
  return `
    <tr><td style="padding:20px 0;border-top:1px solid #e4ddd1;">
      <p style="margin:0 0 4px;font:12px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b5d4f;">${escapeHtml(def.english)}</p>
      <p style="margin:0 0 8px;font:20px/1.4 Georgia,serif;color:#201811;">${escapeHtml(heading)}</p>
      <a href="${url}" style="font:14px system-ui,sans-serif;color:#c1652a;">Read →</a>
    </td></tr>`;
}

export function sectionHeaderHtml(label) {
  return `
    <tr><td style="padding:24px 0 0;">
      <p style="margin:0;font:13px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#c1652a;">${escapeHtml(label)}</p>
    </td></tr>`;
}

export async function removeStaleSubscribers(db) {
  const stale = await db
    .collection("subscribers")
    .where("unopenedStreak", ">=", UNOPENED_LIMIT)
    .get();
  if (stale.empty) return;
  for (const doc of stale.docs) await doc.ref.delete();
  console.log(
    `Removed ${stale.size} subscriber(s) who hadn't opened the last ${UNOPENED_LIMIT} emails.`
  );
}

export async function sendDigest(db, { env, subject, itemsHtml, from }) {
  const subscribersSnap = await db.collection("subscribers").get();
  if (subscribersSnap.empty) {
    console.log("No subscribers — nothing to send.");
    return { sent: 0, total: 0 };
  }

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
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from ?? `Yuvraj Sampath <${env.RESEND_FROM_EMAIL}>`,
        to: email,
        subject,
        html,
        tags: [{ name: "subscriber_id", value: sub.id }],
      }),
    });

    if (res.ok) {
      sent++;
      await sub.ref.update({ unopenedStreak: FieldValue.increment(1) });
    } else {
      console.error(`Failed to send to ${email}: ${res.status} ${await res.text()}`);
    }
  }
  console.log(`Sent ${sent}/${subscribersSnap.size}.`);
  return { sent, total: subscribersSnap.size };
}
