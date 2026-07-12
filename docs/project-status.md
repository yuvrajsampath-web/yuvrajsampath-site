# Project status & continuation notes

Read this after `docs/architecture.md` (the technical reference). This file is
the narrative: what's been done, how this project is worked on, and what's
still open — written so a new session picking this up cold can continue
without re-deriving context or re-litigating settled decisions.

**Do not put credentials, account emails, or the logins/services inventory in
this file or anywhere else in the repo.** That lives only behind Firebase Auth
at `/tirupur/architecture` (see "Sensitive info" below) — deliberately kept
out of git.

## What this project is

A bilingual (Tamil/English) author site for M. M. Sampath Kumar ("Yuvraj
Sampath") — daily haiku, stories, poetry, essays, short stories, and a
podcast/video section, each category carrying a Tamil bird name. Built from
scratch as Next.js + Firebase + Netlify, originally scoped for Squarespace
but pivoted early (Squarespace is DNS-only now). A hidden portal
(`/tirupur`) lets the non-technical author publish content himself with no
git/code involved.

Full technical architecture — system map, content model, the Admin/Client
SDK split, deploy pipeline, design system — is in `docs/architecture.md`.
Don't duplicate that here; this file is status and history, that one is the
reference.

## Current state (as of the last session)

The site is **live, stable, and feature-complete** at yuvrajsampath.com. The
author can independently: write/edit/delete entries in all 5 writing
categories plus media, upload cover images and (for stories) audio
recordings, and import `.docx`/`.pdf` files into the rich editor. Email
subscribers get a daily digest via Resend/GitHub Actions with auto-unsubscribe
for inactivity.

**Known gaps, not bugs:**
- The About page (`src/app/about/page.tsx`) still has four placeholder bio
  sections (dashed-border boxes) — the author never supplied the real text
  for early life, entrepreneurship history, sustainability work, and "on
  writing." Don't fill these in with invented content; wait for real copy.

## Netlify credits — read this before deploying anything

**The Netlify account ran out of its free-tier deploy credits (300/month) on
2026-07-11**, after 34 deploys in about 36 hours of active development. The
plan resets **2026-08-09**. The user explicitly chose to wait for the reset
rather than add credits or upgrade — confirm this is still their preference
before assuming otherwise, since that date will have passed in future
sessions.

**Practical implications:**
- Every `git push` to `main` triggers a Netlify build attempt regardless of
  credit balance — if credits are still exhausted, the build gets skipped
  (visible in Netlify's deploy list as `error … Skipped due to account credit
  usage exceeded`), not queued or retried. The live site keeps serving
  whatever the last *successful* deploy was; nothing breaks, but nothing new
  ships either.
- Once credits are available again (reset, or the user adds credits): normal
  deploys resume automatically on the next push — no special action needed.
- **Going forward, batch changes into fewer, larger deploys rather than
  pushing after every single small request**, the way earlier sessions did.
  That pace is what burned through the free tier in under two days. Ask the
  user if they'd like several requested changes bundled into one commit/deploy
  when it's reasonable to do so.
- Publishing content through the portal (`/tirupur`) **never** costs deploy
  credits — it's a direct Firestore write from the author's browser, nothing
  to do with Netlify. Only actual code changes pushed to GitHub cost credits.
  This distinction has come up before; it's worth being clear about if asked.

## Pending work: the Story → Short Story merge

The user asked to merge தூவானை (Story) into சிறு மயில் (Short Story) —
removing Story as a category and folding its one entry into Short Story. This
was **fully implemented, tested, and pushed once already** (commit
`2dc0ebd`), but the deploy for it hit the credit exhaustion above and was
skipped, so it never went live. Rather than leave the repo and the live site
out of sync, it was **reverted** (commit `7d7ad88`) and the one migrated
Firestore document was moved back to `category: "story"` to match.

**The merge is still wanted, just deferred.** When the user is ready (after
the credit situation resolves), redo it — the exact recipe, already proven to
work:

1. Migrate Firestore: find `writings` docs with `category == "story"`,
   update each to `category: "shortstory"` (was exactly one document,
   id `NSgCj8Hi04yR3pXBiEcl`, at the time this was last done — check current
   count first, there may be more by then).
2. In `src/lib/categories.ts`: remove `"story"` from the `CategorySlug`
   union and delete its `CATEGORIES` entry. Set `hasAudio: true` on
   `shortstory` (Story had audio upload enabled; Short Story should inherit
   it so nothing is lost).
3. In `src/lib/mock-data.ts`: change the story mock entry's `category` to
   `"shortstory"`.
4. In `src/app/page.tsx`: remove `"story"` from `PREVIEW_CATEGORIES`.
5. Add permanent redirects in `next.config.ts`: `/story` → `/shortstory` and
   `/story/:path*` → `/shortstory/:path*` (old links, including any already
   emailed to subscribers, keep working).
6. Update the content-model table in both `docs/architecture.md` and
   `src/app/tirupur/architecture/page.tsx` to drop the `story` row and mark
   `shortstory`'s audio column `yes`.
7. Verify locally (lint, build, dev server + Playwright: nav no longer shows
   தூவானை, the migrated entry renders under சிறு மயில் with its cover image
   and audio intact, old `/story/[id]` URLs redirect correctly) before
   pushing — this was all confirmed working last time, so the same checks
   should pass again.

Ask before redoing this if it's been a while — confirm the user still wants
it and that credits are actually available before pushing.

## Working conventions established on this project

- **Verification sequence before calling anything done:** `npm run lint` →
  `npm run build` → start dev server (`nohup npm run dev`, background,
  `/tmp/dev.pid` + `/tmp/nextdev.log`) → Playwright screenshot/behavior check
  → commit (heredoc message, `Co-Authored-By: Claude Sonnet 5
  <noreply@anthropic.com>`) → push → poll the live URL until the deploy
  lands → one final screenshot/check against production. Always clean up
  scratch scripts, temp routes, and the dev server afterward.
- **npm cache workaround:** the global `~/.npm` cache is corrupted/permission
  broken on this machine. Always set
  `NPM_CONFIG_CACHE=<scratchpad>/npm-cache` for `npm install` / `npm run
  build` / `npm run lint` / `netlify` commands.
- **Playwright gets pruned from `node_modules` between sessions** — re-run
  `npm install --no-save playwright` before any screenshot/verification
  script.
- **Category-level flags drive all display logic**, never per-document field
  presence (see `docs/architecture.md`, "Content model" — this was a real bug
  once). When adding a category-specific feature, add a flag to
  `CategoryDef` rather than checking field presence on individual documents.
- **`firestore.rules` / `storage.rules` changes need manual publishing** in
  the Firebase console — the CLI deploy path is broken (IAM). This has
  caused a real outage before (a nesting mistake silently denied all
  reads/writes). Never assume a rules file change is live just because it's
  committed.
- **Temporary auth-bypass testing pattern:** to visually verify something
  behind `AuthGate` (portal pages) without real credentials, create a
  throwaway route outside `/tirupur` that renders the same page component
  directly, screenshot it, then delete the throwaway route. Used several
  times, works well, always clean up after.
- **When a user message is just a pasted image with no text**, ask what they
  want before acting — don't guess. Sometimes the image is unrelated/stale
  and they'll say "ignore it."

## Sensitive info — what's deliberately not in this repo

The full inventory of accounts/credentials (Firebase console, GitHub,
Netlify, Squarespace, Resend, the portal's own login, and where each
machine-to-machine secret is stored) lives **only** at `/tirupur/architecture`
in the running app, gated behind Firebase Auth. It was deliberately kept out
of `docs/architecture.md` and out of git entirely, per explicit user
instruction — don't add it to any git-tracked file, including this one, even
if asked to "document the logins" again. Point back to that portal page
instead.

## Who's who

- The person directing this work day-to-day (git identity "Senthil Arasu")
  handles the technical/business side.
- The actual author and site owner (Yuvraj Sampath) is a separate person who
  uses the portal to publish content and is not part of these coding
  sessions.
