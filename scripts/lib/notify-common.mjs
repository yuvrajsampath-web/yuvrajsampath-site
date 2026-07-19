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

// Recurring sign-off the author appends to daily posts as its own line;
// not part of the poem itself, so it's dropped from the digest rendering.
const DAILY_SIGNOFF_LINE = /^காலை\s+வணக்கம்[.\s]*$/;

function stripDailySignoff(raw) {
  return raw
    .split("\n")
    .filter((line) => !DAILY_SIGNOFF_LINE.test(line.trim()))
    .join("\n")
    .trim();
}

export function headingFor(w) {
  const def = CATEGORY_LABELS[w.category] ?? CATEGORY_LABELS.daily;
  if (def.hasTitle && w.title) return w.title;
  if (w.category === "daily") {
    // Mirrors the site's own rendering (whitespace-pre-line over the raw
    // string, no HTML) — line breaks are preserved, not collapsed.
    return stripDailySignoff(w.body);
  }
  const raw = def.format === "rich" ? stripHtml(w.body) : w.body;
  return raw.replace(/\s+/g, " ").trim().slice(0, 80);
}

// First 3 words of a heading, or up to (not including) the first comma —
// whichever comes first — followed by "...". Used only for email subjects;
// the full text still appears in the email body via headingFor/entryRowHtml.
export function truncateForSubject(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const parts = [];
  for (const word of words) {
    if (parts.length >= 3) break;
    const commaIdx = word.indexOf(",");
    if (commaIdx !== -1) {
      const before = word.slice(0, commaIdx);
      if (before) parts.push(before);
      break;
    }
    parts.push(word);
  }
  return `${parts.join(" ")}...`;
}

const POSTED_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function formatPostedDate(publishedAt) {
  return POSTED_DATE_FMT.format(new Date(`${publishedAt}T12:00:00Z`));
}

export function entryRowHtml(w) {
  const def = CATEGORY_LABELS[w.category] ?? CATEGORY_LABELS.daily;
  const heading = headingFor(w);
  const url = `${SITE_URL}/${w.category}/${w.id}`;
  const isDaily = w.category === "daily";
  const label = isDaily ? formatPostedDate(w.publishedAt) : def.english;
  // குறிஞ்சிட்டு entries already show their full text inline, so a "Read"
  // link is redundant there; other categories only show a short excerpt
  // and need it to reach the full piece.
  const readLink = isDaily
    ? ""
    : `<a href="${url}" style="font:14px system-ui,sans-serif;color:#c1652a;">Read →</a>`;
  return `
    <tr><td style="padding:20px 0;border-top:1px solid #e4ddd1;">
      <p style="margin:0 0 4px;font:12px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b5d4f;">${escapeHtml(label)}</p>
      <p style="margin:0 0 8px;font:20px/1.4 Georgia,serif;color:#201811;white-space:pre-line;">${escapeHtml(heading)}</p>
      ${readLink}
    </td></tr>`;
}

// labelHtml is trusted, pre-built HTML (may mix a styled English span with
// plain Tamil text) rather than a plain string — see notify-weekly.mjs for
// why: text-transform/letter-spacing on Tamil script breaks its rendering,
// so only the English portion gets those styles applied.
export function sectionHeaderHtml(labelHtml) {
  return `
    <tr><td style="padding:24px 0 0;">
      <p style="margin:0;font:13px system-ui,sans-serif;color:#c1652a;">${labelHtml}</p>
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

// A vCard attachment is the standard cross-client way to prompt an
// "Add to contacts" action (Gmail, Outlook, and Apple Mail all render an
// inline button for it) — covers both sender addresses in one card, since
// Gmail's Primary/Updates sorting is learned per exact From address.
const VCARD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "FN:Yuvraj Sampath",
  "EMAIL;TYPE=INTERNET:daily@yuvrajsampath.com",
  "EMAIL;TYPE=INTERNET:weekly@yuvrajsampath.com",
  "URL:https://yuvrajsampath.com",
  "END:VCARD",
].join("\r\n");

export const VCARD_ATTACHMENT = {
  filename: "yuvraj-sampath.vcf",
  content: Buffer.from(VCARD, "utf-8").toString("base64"),
};

export function wrapEmailHtml(itemsHtml, unsubUrl) {
  return `<!doctype html><html><body style="margin:0;background:#f6f3ec;padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;">
        <tr><td>
          <table role="presentation" width="100%" style="background:#ffffff;border-radius:8px;padding:32px;">
            <tr><td>
              <p style="margin:0 0 24px;font:italic 22px Georgia,serif;color:#201811;">Yuvraj Sampath</p>
              <table role="presentation" width="100%">${itemsHtml}</table>
            </td></tr>
          </table>
          <table role="presentation" width="100%" style="padding:20px 8px 0;">
            <tr><td>
              <p style="margin:0;font:12px system-ui,sans-serif;color:#6b5d4f;">
                Landing outside your Primary inbox? Drag this email there once,
                or save the attached contact card — Gmail remembers both.
              </p>
              <p style="margin:8px 0 0;font:12px system-ui,sans-serif;color:#6b5d4f;">
                <a href="${unsubUrl}" style="color:#6b5d4f;">Unsubscribe</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;
}

// Sends one real email to a single address, bypassing the subscribers
// collection entirely: no unopenedStreak update, no cursor mutation. Used
// for `test_to` previews (see notify-daily.mjs / notify-weekly.mjs) so a
// preview send can never touch production subscriber state.
export async function sendTestEmail(db, { env, subject, itemsHtml, from, to }) {
  const html = wrapEmailHtml(itemsHtml, `${SITE_URL}/api/unsubscribe?email=test&token=test`);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from ?? `Yuvraj Sampath <${env.RESEND_FROM_EMAIL}>`,
      to,
      subject: `[TEST] ${subject}`,
      html,
      attachments: [VCARD_ATTACHMENT],
      tags: [{ name: "test", value: "true" }],
    }),
  });
  if (!res.ok) {
    console.error(`Test send failed: ${res.status} ${await res.text()}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Test email sent to ${to}.`);
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
    const html = wrapEmailHtml(itemsHtml, unsubUrl);

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
        attachments: [VCARD_ATTACHMENT],
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
