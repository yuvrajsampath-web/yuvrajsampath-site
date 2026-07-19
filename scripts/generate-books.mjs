// Compiles all "daily" category writings (குறிஞ்சிட்டு haiku) into three
// print-ready PDF volumes under a shared "வானம்பாடி" (Vanambadi/skylark)
// title, uploads them to Firebase Storage, and records them in a new
// Firestore "books" collection (read by src/lib/data.ts getBooks()).
//
// Not an ongoing pipeline like the notify-*.mjs digests — this is a
// point-in-time compilation of whatever "daily" entries currently exist,
// re-run manually (via workflow_dispatch) whenever a fresh edition is wanted.
import React from "react";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";

const h = React.createElement;

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_STORAGE_BUCKET,
} = process.env;

for (const [name, value] of Object.entries({
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_STORAGE_BUCKET,
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
  storageBucket: FIREBASE_STORAGE_BUCKET,
});

const db = getFirestore();
const bucket = getStorage().bucket();

const fontPath = (pkg, file) => new URL(`../node_modules/${pkg}/files/${file}`, import.meta.url).pathname;

Font.register({
  family: "NotoSerifTamil",
  fonts: [
    { src: fontPath("@fontsource/noto-serif-tamil", "noto-serif-tamil-tamil-400-normal.woff") },
    {
      src: fontPath("@fontsource/noto-serif-tamil", "noto-serif-tamil-tamil-700-normal.woff"),
      fontWeight: 700,
    },
  ],
});
Font.register({
  family: "NotoSansTamil",
  fonts: [{ src: fontPath("@fontsource/noto-sans-tamil", "noto-sans-tamil-tamil-400-normal.woff") }],
});

const PAGE_SIZE = [360, 504]; // 5in x 7in at 72pt/in
const TAMIL_TITLE = "வானம்பாடி";
const BOOK_LABELS = ["Book One", "Book Two", "Book Three"];
const BOOK_COUNT = BOOK_LABELS.length;
const CREAM = "#fff8ee";
const INK = "#201811";
const MUTED = "#6b5d4f";
const LINE = "#e4ddd1";

// Same recurring sign-off stripped from the email digests (see
// scripts/lib/notify-common.mjs) — not part of the poem itself.
const DAILY_SIGNOFF = /காலை\s+வணக்கம்[.\s]*/g;
function cleanBody(raw) {
  return raw.replace(DAILY_SIGNOFF, "").trim();
}

// Deterministic shuffle (mulberry32) so re-running the script without new
// haiku reproduces the same three volumes rather than reshuffling at random.
function seededShuffle(arr, seed) {
  let s = seed;
  function rand() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
function formatDate(publishedAt) {
  return DATE_FMT.format(new Date(`${publishedAt}T12:00:00Z`));
}

function coverPage(index, count, dateRange) {
  return h(
    Page,
    { size: PAGE_SIZE },
    h(
      Svg,
      { style: { position: "absolute", width: "100%", height: "100%" } },
      h(
        Defs,
        null,
        h(
          LinearGradient,
          { id: "sky", x1: "0", y1: "0", x2: "0", y2: "1" },
          h(Stop, { offset: "0", stopColor: "#f4c88b" }),
          h(Stop, { offset: "0.55", stopColor: "#db7a3c" }),
          h(Stop, { offset: "1", stopColor: "#2a1410" })
        )
      ),
      h(Rect, { x: 0, y: 0, width: PAGE_SIZE[0], height: PAGE_SIZE[1], fill: "url(#sky)" })
    ),
    h(
      View,
      {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: 40,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        },
      },
      h(
        Text,
        { style: { fontFamily: "NotoSerifTamil", fontWeight: 700, fontSize: 42, color: CREAM, textAlign: "center" } },
        TAMIL_TITLE
      ),
      h(
        Text,
        { style: { marginTop: 10, fontSize: 11, color: CREAM, letterSpacing: 2 } },
        BOOK_LABELS[index].toUpperCase()
      ),
      h(View, { style: { marginTop: 28, width: 60, height: 1, backgroundColor: CREAM, opacity: 0.6 } }),
      h(
        Text,
        {
          style: {
            fontFamily: "NotoSansTamil",
            marginTop: 20,
            fontSize: 9,
            color: CREAM,
            opacity: 0.85,
            letterSpacing: 1,
          },
        },
        `${count} குறிஞ்சிட்டு`
      ),
      h(Text, { style: { marginTop: 4, fontSize: 8, color: CREAM, opacity: 0.7 } }, dateRange)
    ),
    h(
      Text,
      {
        style: {
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 8,
          color: CREAM,
          opacity: 0.7,
          letterSpacing: 1,
        },
      },
      "YUVRAJ SAMPATH  ·  yuvrajsampath.com"
    )
  );
}

function colophonPage(index, count, dateRange) {
  return h(
    Page,
    { size: PAGE_SIZE, style: { padding: 48, display: "flex", flexDirection: "column", justifyContent: "center" } },
    h(Text, { style: { fontFamily: "NotoSerifTamil", fontSize: 22, color: INK } }, TAMIL_TITLE),
    h(Text, { style: { marginTop: 6, fontSize: 11, color: MUTED, letterSpacing: 1 } }, `${BOOK_LABELS[index]} of ${BOOK_COUNT}`),
    h(View, { style: { marginTop: 24, width: 40, height: 1, backgroundColor: LINE } }),
    h(
      Text,
      { style: { fontFamily: "NotoSansTamil", marginTop: 24, fontSize: 10, color: MUTED, lineHeight: 1.6 } },
      `A collection of ${count} குறிஞ்சிட்டு — daily haiku by Yuvraj Sampath, written ${dateRange}.`
    ),
    h(
      Text,
      { style: { marginTop: 40, fontSize: 8, color: MUTED, opacity: 0.7 } },
      `Compiled ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
    )
  );
}

// Keeps "one poem, one page" even for the rare long entry (a handful run to
// 13-14 lines against a typical 3-6) by scaling text down to fit the fixed
// 5x7in page instead of letting react-pdf spill it onto a continuation page.
function sizeForLineCount(lineCount) {
  if (lineCount <= 6) return { fontSize: 19, lineHeight: 1.8 };
  if (lineCount <= 9) return { fontSize: 17, lineHeight: 1.6 };
  if (lineCount <= 12) return { fontSize: 15, lineHeight: 1.5 };
  return { fontSize: 13, lineHeight: 1.4 };
}

function haikuPage(entry, pageNumber) {
  const text = cleanBody(entry.body);
  const { fontSize, lineHeight } = sizeForLineCount(text.split("\n").length);
  return h(
    Page,
    { size: PAGE_SIZE, style: { padding: 44, display: "flex", flexDirection: "column" } },
    h(
      Text,
      { style: { fontSize: 9, letterSpacing: 1.5, color: MUTED, textTransform: "uppercase" } },
      formatDate(entry.publishedAt)
    ),
    h(
      View,
      { style: { flex: 1, display: "flex", justifyContent: "center" } },
      h(Text, { style: { fontFamily: "NotoSansTamil", fontSize, lineHeight, color: INK } }, text)
    ),
    h(Text, { style: { textAlign: "center", fontSize: 8, color: MUTED } }, String(pageNumber))
  );
}

const snap = await db.collection("writings").where("category", "==", "daily").get();
const all = snap.docs
  .map((d) => ({ id: d.id, ...d.data() }))
  .filter((w) => w.body && cleanBody(w.body).length > 0);

console.log(`Fetched ${all.length} daily entries with content.`);

const shuffled = seededShuffle(all, 20260719);
const groups = Array.from({ length: BOOK_COUNT }, () => []);
shuffled.forEach((entry, i) => groups[i % BOOK_COUNT].push(entry));

for (let i = 0; i < BOOK_COUNT; i++) {
  const group = groups[i].slice().sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const count = group.length;
  const dateRange = count
    ? `${formatDate(group[0].publishedAt)} – ${formatDate(group[count - 1].publishedAt)}`
    : "";

  const pages = [
    coverPage(i, count, dateRange),
    colophonPage(i, count, dateRange),
    ...group.map((entry, idx) => haikuPage(entry, idx + 1)),
  ];

  const doc = h(Document, { title: `${TAMIL_TITLE} — ${BOOK_LABELS[i]}`, author: "Yuvraj Sampath" }, ...pages);
  const buffer = await renderToBuffer(doc);

  const filePath = `books/vanambadi-book-${i + 1}.pdf`;
  const file = bucket.file(filePath);
  await file.save(buffer, {
    contentType: "application/pdf",
    metadata: { cacheControl: "public, max-age=3600" },
  });
  const pdfUrl = await getDownloadURL(file);

  await db
    .collection("books")
    .doc(`book-${i + 1}`)
    .set({
      order: i + 1,
      title: BOOK_LABELS[i],
      tamilTitle: TAMIL_TITLE,
      haikuCount: count,
      dateRange,
      pdfUrl,
      pdfSizeBytes: buffer.length,
      generatedAt: Timestamp.now(),
    });

  console.log(
    `${BOOK_LABELS[i]}: ${count} haiku, ${(buffer.length / 1024 / 1024).toFixed(2)} MB → ${pdfUrl}`
  );
}

console.log("Done.");
