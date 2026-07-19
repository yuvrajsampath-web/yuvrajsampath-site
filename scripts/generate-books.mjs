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

// Break after every comma or ellipsis (2+ dots) within a line, a natural
// pause point for these short-line poems, while leaving blank stanza-gap
// lines alone (handled separately by normalizeBlankLines).
function expandPunctuationBreaks(text) {
  return text
    .split("\n")
    .flatMap((line) => {
      if (line.trim() === "") return [""];
      return line
        .replace(/([,]|\.{2,})\s*/g, "$1\n")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    })
    .join("\n");
}

// The author sometimes leaves one blank line between stanzas, sometimes
// two or three inconsistently — collapse any run down to a single blank
// line so spacing reads the same throughout every book.
function normalizeBlankLines(text) {
  return text.replace(/\n{3,}/g, "\n\n");
}

function cleanBody(raw) {
  const signoffStripped = raw.replace(DAILY_SIGNOFF, "").trim();
  return expandPunctuationBreaks(normalizeBlankLines(signoffStripped));
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

// A small flying-bird silhouette (generic bird-in-flight glyph).
const BIRD_PATH =
  "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z";

// Thin frame inset from the page edge, with the bird motif perched in the
// bottom-right corner — same treatment on every interior page.
function pageBorder(color) {
  const inset = 20;
  const width = PAGE_SIZE[0] - inset * 2;
  const height = PAGE_SIZE[1] - inset * 2;
  return h(
    React.Fragment,
    null,
    h(
      Svg,
      { style: { position: "absolute", width: "100%", height: "100%" } },
      h(Rect, { x: inset, y: inset, width, height, stroke: color, strokeWidth: 0.75, fill: "none" })
    ),
    h(
      Svg,
      { viewBox: "0 0 24 24", style: { position: "absolute", width: 18, height: 18, right: 26, bottom: 26 } },
      h(Path, { d: BIRD_PATH, fill: color })
    )
  );
}

function coverPage(index) {
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
      h(View, { style: { marginTop: 24, width: 60, height: 1, backgroundColor: CREAM, opacity: 0.6 } })
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

function colophonPage(index) {
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
        "A collection of குறிஞ்சிட்டு by Yuvraj Sampath."
      )
    )
  );
}

// Fixed size for every entry — longer poems wrap naturally within the
// page instead of shrinking to fit. 12/1.35 was chosen empirically: it's
// the largest size at which every one of the 596 real entries still fits
// on a single page after punctuation-break expansion and blank-line
// normalization (larger sizes started spilling a handful of outliers onto
// a second physical page — react-pdf would continue them there rather
// than clip anything, but one-page-per-poem stays cleaner where free).
const HAIKU_FONT_SIZE = 12;
const HAIKU_LINE_HEIGHT = 1.35;

function haikuPage(entry, pageNumber) {
  const text = cleanBody(entry.body);
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
          {
            style: {
              fontFamily: "NotoSansTamil",
              fontSize: HAIKU_FONT_SIZE,
              lineHeight: HAIKU_LINE_HEIGHT,
              color: INK,
              textAlign: "left",
            },
          },
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
    coverPage(i),
    colophonPage(i),
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
