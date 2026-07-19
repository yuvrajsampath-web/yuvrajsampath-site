// Compiles all "daily" category writings (குறிஞ்சிட்டு) into three
// print-ready PDF volumes titled "சிந்தித்து பாருங்கள்", uploads them to
// Firebase Storage, and records them in a Firestore "books" collection
// (read by src/lib/data.ts getBooks()). The section itself is branded
// வானம்பாடி (see src/components/TopNav.tsx / src/app/books/page.tsx) —
// that's the site's bird-name identity for the section, distinct from
// this particular compilation's own printed title.
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
  Path,
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

const PAGE_SIZE = [504, 360]; // 7in x 5in landscape at 72pt/in
const BOOK_TITLE = "சிந்தித்து பாருங்கள்";
const THOGUPU_LABELS = ["தொகுப்பு 1", "தொகுப்பு 2", "தொகுப்பு 3"];
const BOOK_COUNT = THOGUPU_LABELS.length;
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
// entries reproduces the same three volumes rather than reshuffling at random.
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

// A small two-arc "bird in flight" doodle, centered at (cx, y).
function birdMotif(cx, y, color) {
  const half = 13;
  return h(Path, {
    d: `M ${cx - half * 2} ${y + 5} Q ${cx - half} ${y - 6} ${cx} ${y + 5} Q ${cx + half} ${y - 6} ${cx + half * 2} ${y + 5}`,
    stroke: color,
    strokeWidth: 1.3,
    fill: "none",
  });
}

// Thin frame inset from the page edge, with the bird motif perched above
// the top line — same treatment on every interior page.
function pageBorder(color) {
  const inset = 20;
  const width = PAGE_SIZE[0] - inset * 2;
  const height = PAGE_SIZE[1] - inset * 2;
  return h(
    Svg,
    { style: { position: "absolute", width: "100%", height: "100%" } },
    h(Rect, { x: inset, y: inset, width, height, stroke: color, strokeWidth: 0.75, fill: "none" }),
    birdMotif(PAGE_SIZE[0] / 2, inset - 9, color)
  );
}

function coverPage(index, count) {
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
    pageBorder(CREAM),
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
        {
          style: {
            fontFamily: "NotoSerifTamil",
            fontWeight: 700,
            fontSize: 32,
            color: CREAM,
            textAlign: "center",
          },
        },
        BOOK_TITLE
      ),
      h(
        Text,
        {
          style: {
            fontFamily: "NotoSansTamil",
            marginTop: 10,
            fontSize: 11,
            color: CREAM,
            letterSpacing: 2,
          },
        },
        THOGUPU_LABELS[index]
      ),
      h(View, { style: { marginTop: 24, width: 60, height: 1, backgroundColor: CREAM, opacity: 0.6 } }),
      h(
        Text,
        {
          style: {
            fontFamily: "NotoSansTamil",
            marginTop: 16,
            fontSize: 9,
            color: CREAM,
            opacity: 0.85,
            letterSpacing: 1,
          },
        },
        `${count} குறிஞ்சிட்டு`
      )
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

function colophonPage(index, count) {
  return h(
    Page,
    { size: PAGE_SIZE },
    pageBorder(MUTED),
    h(
      View,
      { style: { padding: 48, display: "flex", flexDirection: "column", justifyContent: "center" } },
      h(Text, { style: { fontFamily: "NotoSerifTamil", fontSize: 22, color: INK } }, BOOK_TITLE),
      h(
        Text,
        { style: { fontFamily: "NotoSansTamil", marginTop: 6, fontSize: 11, color: MUTED, letterSpacing: 1 } },
        THOGUPU_LABELS[index]
      ),
      h(View, { style: { marginTop: 20, width: 40, height: 1, backgroundColor: LINE } }),
      h(
        Text,
        { style: { fontFamily: "NotoSansTamil", marginTop: 20, fontSize: 10, color: MUTED, lineHeight: 1.6 } },
        `${count} குறிஞ்சிட்டு by Yuvraj Sampath.`
      )
    )
  );
}

// Keeps "one poem, one page" on the fixed landscape page (much less
// vertical room than a portrait layout) even for outlier entries. Two
// independent failure modes need covering: many short explicit line
// breaks (stanza gaps stack up vertically even though the text itself is
// short) and a single long unbroken line (wraps and eats width instead of
// height) — so this picks whichever tier is more conservative for each,
// verified empirically against every real entry with no overflow left
// (see the diagnose-overflow*.mjs throwaway scripts used during tuning).
const LINE_TIERS = [
  [4, { fontSize: 20, lineHeight: 1.9 }],
  [6, { fontSize: 18, lineHeight: 1.7 }],
  [9, { fontSize: 15, lineHeight: 1.55 }],
  [12, { fontSize: 13, lineHeight: 1.45 }],
  [Infinity, { fontSize: 11, lineHeight: 1.35 }],
];
const CHAR_TIERS = [
  [40, { fontSize: 20, lineHeight: 1.9 }],
  [70, { fontSize: 18, lineHeight: 1.7 }],
  [110, { fontSize: 16, lineHeight: 1.55 }],
  [150, { fontSize: 14, lineHeight: 1.45 }],
  [200, { fontSize: 12, lineHeight: 1.35 }],
  [260, { fontSize: 10, lineHeight: 1.25 }],
  [Infinity, { fontSize: 9, lineHeight: 1.2 }],
];
function pickTier(tiers, n) {
  return tiers.find(([max]) => n <= max)[1];
}
function sizeForText(text) {
  const byLines = pickTier(LINE_TIERS, text.split("\n").length);
  const byChars = pickTier(CHAR_TIERS, text.length);
  return byLines.fontSize <= byChars.fontSize ? byLines : byChars;
}

function haikuPage(entry, pageNumber) {
  const text = cleanBody(entry.body);
  const { fontSize, lineHeight } = sizeForText(text);
  return h(
    Page,
    { size: PAGE_SIZE },
    pageBorder(MUTED),
    h(
      View,
      { style: { flex: 1, padding: 44, display: "flex", flexDirection: "column" } },
      h(
        View,
        { style: { flex: 1, display: "flex", justifyContent: "center" } },
        h(
          Text,
          { style: { fontFamily: "NotoSansTamil", fontSize, lineHeight, color: INK, textAlign: "center" } },
          text
        )
      ),
      h(Text, { style: { textAlign: "center", fontSize: 8, color: MUTED } }, String(pageNumber))
    )
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

  const pages = [
    coverPage(i, count),
    colophonPage(i, count),
    ...group.map((entry, idx) => haikuPage(entry, idx + 1)),
  ];

  const doc = h(Document, { title: `${BOOK_TITLE} — ${THOGUPU_LABELS[i]}`, author: "Yuvraj Sampath" }, ...pages);
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
      title: THOGUPU_LABELS[i],
      tamilTitle: BOOK_TITLE,
      haikuCount: count,
      pdfUrl,
      pdfSizeBytes: buffer.length,
      generatedAt: Timestamp.now(),
    });

  console.log(
    `${THOGUPU_LABELS[i]}: ${count} entries, ${(buffer.length / 1024 / 1024).toFixed(2)} MB → ${pdfUrl}`
  );
}

console.log("Done.");
