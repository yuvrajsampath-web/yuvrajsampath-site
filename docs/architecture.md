# Architecture

How yuvrajsampath.com is built, why it's built that way, and where to look
when something needs to change. Written for whoever touches this repo next
— human or AI — with no assumed memory of how it got this way.

## What this site is

A bilingual (Tamil/English) author site for M. M. Sampath Kumar
("Yuvraj Sampath"). Five writing categories plus a media (podcast/video)
section, each carrying a Tamil bird name as its identity. A hidden portal
lets the non-technical author publish new writing himself — no git, no code,
no CMS login screen a stranger would recognize as one.

The whole thing is designed around one constraint: **stay on Firebase's free
Spark plan.** No Cloud Functions, no Blaze billing. Everything that would
normally be a Firebase Function is instead either a Netlify serverless
function or a scheduled GitHub Action.

## System map

```
┌─────────────┐     DNS only      ┌──────────────┐
│ Squarespace │ ────────────────► │   Netlify    │
│  (domain)   │                   │  (hosting +  │
└─────────────┘                   │   CI/CD)     │
                                   └──────┬───────┘
                                          │ builds from
                                          ▼
                                   ┌──────────────┐
                                   │    GitHub    │
                                   │ (source repo)│
                                   └──────┬───────┘
                                          │ Actions (cron)
                       ┌──────────────────┼──────────────────┐
                       ▼                                     ▼
              ┌──────────────────┐                  ┌────────────────┐
              │ backup-firestore │                  │notify-subscribe│
              │  (nightly JSON)  │                  │  (daily digest │
              └────────┬─────────┘                  │   via Resend)  │
                        │                            └────────┬───────┘
                        ▼                                     ▼
                ┌───────────────┐                      ┌────────────┐
                │   Firebase    │                      │   Resend   │
                │ ┌───────────┐ │                      │ (transact- │
                │ │ Firestore │ │◄─────reads/writes─────│ ional      │
                │ │   Auth    │ │      (Admin SDK       │  email)    │
                │ │  Storage  │ │       server-side,    └────────────┘
                │ └───────────┘ │       Client SDK
                └───────────────┘       in portal only)
```

The Next.js app itself renders public pages by reading Firestore directly
(server-side, Admin SDK) — there's no separate API layer for the public
site. The only "backend" beyond Firebase is a handful of Netlify serverless
functions (`src/app/api/*`) for things a public visitor triggers
(subscribe/unsubscribe, Resend's webhook) that need to run with elevated
credentials.

## Content model

Every piece of writing is one `Writing` document in Firestore
(`src/lib/types.ts`), tagged with a `category`. There is no separate schema
per category — behavior differs by looking up **category-level flags**, not
by checking whether a field happens to be present on a document. This was a
real, painful bug once (a legacy `title` field leftover on a `daily` entry
made it render wrong in five different places until every check was
switched from `if (w.title)` to `if (def.hasTitle && w.title)`), so it's
worth stating as a rule: **display logic reads `CATEGORY_BY_SLUG[slug]`,
never raw field presence.**

`src/lib/categories.ts` is the single source of truth:

| slug | Tamil | meaning | format | title? | topics? | paginated? | audio? |
|---|---|---|---|---|---|---|---|
| `daily` | குறிஞ்சிட்டு | small mountain bird, soft voice | plain | no | yes | yes (by month) | no |
| `poetry` | முருகு சிட்டு | a bird beautiful enough for verse | plain | yes | no | no | no |
| `essay` | அன்னம் | the noble freshwater bird | rich | yes | no | no | no |
| `shortstory` | சிறு மயில் | the small peacock | rich | yes | no | no | **yes** |

`story` (தூவானை) existed early on and was later merged into `shortstory` —
old `/story/*` links redirect to `/shortstory/*` (see `next.config.ts`),
and `shortstory` inherited the audio-upload capability `story` had.

Media (podcasts/videos, குயில்) is a **separate** Firestore collection and
type (`MediaEntry`), not a sixth entry in `CATEGORIES` — it has no title/body
distinction, just a `kind` (`podcast`/`video`), a `url`, and optional
description. Anywhere the UI needs to show media alongside writings (the
homepage "More" grid), it's fetched and merged manually, not through the
category system.

`format: "plain"` categories store body text as-is (line breaks preserved
with `whitespace-pre-line`). `format: "rich"` categories store HTML produced
by the portal's Tiptap editor, rendered via `RichBody`.

## Rendering & the two Firebase SDKs

This is the one architectural line that matters most:

- **`src/lib/firebase/admin.ts`** (Admin SDK, `server-only`) — used by every
  public page (`src/lib/data.ts`) to read Firestore. Runs server-side only,
  full read access, never shipped to the browser.
- **`src/lib/firebase/client.ts`** (Client SDK) — used **only** inside the
  portal (`src/app/tirupur/**`, `src/components/portal/**`). Runs in the
  visitor's (i.e. the author's) browser, gated by Firebase Auth + security
  rules, not by keeping anything secret.

A visitor's browser never loads the Firebase Client SDK or sees a Firebase
project config *unless* they're on the portal. Public pages are ordinary
Next.js Server Components that already have the data by the time HTML
reaches the browser.

`src/lib/data.ts` wraps every read in React's `cache()` so a page component
and its `generateMetadata` sibling — which often want the same document —
share one Firestore read per request instead of two. Every function falls
back to `src/lib/mock-data.ts` if Firebase Admin credentials aren't
configured, so the site is fully browsable without a live Firebase project
(useful for local dev, and was the original path before Firebase existed).

Pages that show live content (`/`, `/[category]`, `/media`, etc.) are marked
`export const dynamic = "force-dynamic"` — without this, Next would
statically prerender them once at build time and new posts would never
appear until the next deploy.

## Route map

```
/                              Homepage — today's daily entry + "More" grid
/reveal                        Standalone splash/title-card page (see below)
/about                         Author bio (some sections still placeholder)
/search                        Client-side fuzzy search (Fuse.js)
/rss.xml                       RSS feed of all writings

/[category]                    Archive for one of the 5 writing categories
/[category]/[id]               One entry (or, for daily, a /YYYY-MM month page)
/[category]/topics             Topic index (daily only — topicIndexed)
/[category]/topics/[topic]     Entries under one topic

/media                         குயில் — podcasts & videos list

/tirupur                       Hidden portal dashboard (Firebase Auth gated)
/tirupur/writings/new          New writing form
/tirupur/writings/[id]/edit    Edit an existing writing
/tirupur/media/new             New podcast/video entry
/tirupur/media/[id]/edit       Edit a media entry

/api/subscribe                 POST — add an email subscriber
/api/unsubscribe                GET — one-click unsubscribe link target
/api/webhooks/resend           POST — Resend delivery/open-tracking webhook
```

## The hidden portal

`src/lib/portal-config.ts` holds the one thing that makes it "hidden": the
route segment name (`PORTAL_PATH`, currently `tirupur`). Changing it is a
folder rename + redeploy, not a config toggle — deliberately, so it can't be
flipped by accident. `robots.ts` disallows it from search indexing using the
same constant.

**The URL is a courtesy, not the lock.** Real access control is:

1. **Firebase Auth** — `AuthGate.tsx` blocks all portal routes until signed
   in, and further checks the signed-in email matches `AUTHOR_EMAIL`
   (`yuvrajsampath@gmail.com`).
2. **Firestore/Storage security rules** (`firestore.rules`, `storage.rules`)
   — every write is gated on `request.auth.uid == "<the author's UID>"`,
   enforced server-side by Firebase regardless of what the client claims.

Publishing flow: `WritingForm.tsx` (rich Tiptap editor for `format: "rich"`
categories, plain textarea otherwise) → optional cover image / audio upload
straight to Firebase Storage from the browser (Client SDK) → `createWriting`
/ `updateWriting` (`src/lib/portal-data.ts`) writes the Firestore document
directly from the browser, under Auth + rules, with **no server in
between**. This is what keeps the whole publishing path off Cloud Functions.

Two extras worth knowing about:
- **File import** (`.docx` via `mammoth`, `.pdf` via `pdfjs-dist`) — both
  run entirely client-side in a dynamic `import()`, so the ~1MB of PDF
  parsing code only loads if someone actually picks a `.pdf` file, and
  nothing is ever uploaded to a server just to extract its text.
- **Audio content-type**: browsers often mis-tag audio-only `.mp4`/`.m4a`
  uploads (common from WhatsApp/voice-recorder exports) as `video/mp4`,
  which silently breaks `<audio>` playback. The upload path
  (`audioContentType()` in `WritingForm.tsx`) forces a correct `audio/*`
  type from the file extension rather than trusting the browser's guess.

## Email & subscribers

Subscriber emails live in Firestore (`subscribers` collection, written only
via `/api/subscribe` using the Admin SDK — never directly from the browser).
Sending is entirely via GitHub Actions, not Firebase:

- **`notify-subscribers.yml`** runs daily, calls `scripts/notify-subscribers.mjs`,
  which reads everything published since `meta/notifications.lastNotifiedAt`
  (a Firestore-stored cursor, not `createdAt` directly — this is what
  prevents a brand-new subscriber from getting the entire back-catalog
  emailed to them) and sends via Resend, tagging each email with the
  subscriber's id.
- **`/api/webhooks/resend`** receives Resend's delivery/open events (verified
  via Svix signing), and an entry that hasn't been opened in 10 consecutive
  days gets automatically removed — Resend's free tier caps at 100
  emails/day, so an unengaged list would eventually block real subscribers.
- **`backup-firestore.yml`** runs nightly and exports every `writings` and
  `media` document to JSON, checked into `backups/`. Firestore has no
  built-in undo; this is that undo.

## Deploy pipeline

Push to `main` → Netlify picks it up automatically (connected via GitHub) →
`next build` → deployed. No manual deploy step in normal operation. Netlify
was chosen over Firebase Hosting specifically so Cloud Functions (and the
Blaze plan they require) are never needed.

**One caveat that's bitten this project before**: `firestore.rules` and
`storage.rules` are **not** part of this deploy — they're separate Firebase
config with no CLI deploy path currently working from this machine (the
default service account lacks `serviceusage.services.get`). Any change to
either file needs to be **pasted manually** into the Firebase console
(Firestore → Rules / Storage → Rules → publish) after merging. This has
caused a real outage once already (a nesting mistake in `firestore.rules`
silently denied all reads/writes until it was caught and fixed).

## Design system

CSS custom properties in `globals.css` (`--paper`, `--ink`, `--surface`,
`--muted`, `--line`, `--amber`, `--amber-ink`, `--amber-soft`), mapped into
Tailwind v4 via `@theme inline`. Both `prefers-color-scheme` and an explicit
`data-theme` attribute (toggled by `ThemeToggle.tsx`, persisted, applied via
an inline pre-hydration script to avoid a flash of the wrong theme) are
supported — the `data-theme` override always wins over the OS preference.

Fonts (`next/font/google`): Fraunces (display), Work Sans (body), Noto Serif
Tamil (Tamil display), Noto Sans Tamil (Tamil body).

`LogoMark.tsx` is a code-generated sticker mark (no image file) — the same
component backs the nav badge, `icon.tsx`, and `apple-icon.tsx` (all via
`next/og`'s `ImageResponse`). A real `favicon.ico` is also checked in
(`src/app/favicon.ico`), generated once by `scripts/generate-favicon-ico.mjs`,
because some browsers request that exact path directly regardless of the
`<link rel="icon">` tag pointing elsewhere.

## `/reveal`

A standalone, deliberately un-navigated page: a full-bleed title-card image
on a matching black background, fading to transparent over 700ms before a
full navigation (`window.location.href`, not the Next.js client router —
`router.push` was silently no-opping here under Turbopack dev, so a real
navigation sidesteps it) to the homepage on click. Not part of the header
nav or footer by design; reached only by direct link.

## Directory reference

```
src/app/                 Routes (Next.js App Router)
src/components/          Shared UI (public site)
src/components/portal/   Portal-only UI (never imported by public pages)
src/lib/                 Data access, types, category config, formatting
scripts/                 One-off / scheduled Node scripts (run outside Next)
docs/reference/          Client-provided source material (gitignored, not part of the site)
firestore.rules          Firestore security rules (manual publish — see above)
storage.rules            Storage security rules (manual publish — see above)
.github/workflows/       Scheduled GitHub Actions (backup, notify)
```

## Why things are the shape they are (quick reference)

- **No Cloud Functions anywhere** → Netlify hosting + GitHub Actions instead,
  so Firebase stays on the free Spark plan.
- **Category flags, not field presence** → avoids the class of bug where one
  document with a stray field renders differently from its siblings.
- **`force-dynamic` on content pages** → without it, new posts wouldn't
  appear until the next deploy.
- **Portal writes go browser → Firestore directly** (no API route) → the
  security boundary is Firebase Auth + rules, not a server we'd otherwise
  have to host.
- **Rules files need manual publishing** → the CLI path is currently broken
  (IAM), and this has caused a real incident — treat every rules change as
  "edit file, then go paste it in the console," not "edit file, done."
