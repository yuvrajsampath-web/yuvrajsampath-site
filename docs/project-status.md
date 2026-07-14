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

## Migrated to Vercel (2026-07-13) — Netlify retired

**The site now runs on Vercel, not Netlify.** What was assumed at the time of
the original Netlify pause (deploys skipped, site keeps serving the last good
build) turned out to be wrong — checking the live URL showed Netlify's actual
"Site not available — paused as it reached its usage limits" screen: the
whole site was down, not just frozen on stale content. Rather than wait for
the 2026-08-09 credit reset, hosting was migrated to Vercel the same day.

What was done, in order:
1. Vercel CLI installed on demand via `npx vercel@latest` (no global install).
   Logged in as the author (`yuvrajsampath@gmail.com`) via `vercel login`.
2. `vercel link` created project `yuvrajsampath-8709s-projects/yuvrajsampath`.
   Connecting the GitHub repo initially failed twice — first needed a GitHub
   **Login Connection** added to the Vercel account (Account Settings →
   Login Connections), then needed the **Vercel GitHub App** itself granted
   access to the `yuvrajsampath-web/yuvrajsampath-site` repo specifically
   (github.com/settings/installations) — these are two separate
   authorization steps, both required.
3. All 10 env vars the app needs at runtime (`NEXT_PUBLIC_FIREBASE_*` ×5,
   `NEXT_PUBLIC_AUTHOR_EMAIL`, `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/
   `FIREBASE_PRIVATE_KEY`, `RESEND_WEBHOOK_SECRET`) were copied into Vercel
   across Production/Preview/Development via `vercel env add`. Nine came from
   local `.env.local`; `RESEND_WEBHOOK_SECRET` isn't in `.env.local` and had
   to be pulled from Netlify's env instead (`netlify env:get
   RESEND_WEBHOOK_SECRET --context production`) since it's only used by
   `src/app/api/webhooks/resend/route.ts`, not by any local script.
4. `vercel deploy --prod` confirmed a real build succeeds and serves live
   Firebase data (not mock fallback) before touching DNS.
5. DNS cutover at Squarespace (still the DNS provider — nameservers were
   **not** changed to Vercel's, only two records were): the apex `A` record
   changed from Netlify's `75.2.60.5` to Vercel's `76.76.21.21`, and the
   `www` record was changed from a CNAME (pointing at Netlify's
   `mellifluous-rabanadas-fa8e3c.netlify.app`) to an `A` record at the same
   Vercel IP. Both required deleting/editing the existing record, not adding
   a new one alongside it. Every other DNS record (Resend's `links` CNAME,
   `send` MX/TXT, `resend._domainkey` TXT, and Squarespace's own Email
   Forwarding records — SPF/DMARC/DKIM/MX via Mailgun, for
   `daily@yuvrajsampath.com` → `yuvrajsampath@gmail.com`) was left alone and
   confirmed still intact afterward.
6. Verified live: HTTPS 200 on both `yuvrajsampath.com` and
   `www.yuvrajsampath.com`, valid Let's Encrypt cert (auto-renewing via
   Vercel), `/tirupur` portal reachable.

**Netlify's old site can be fully retired/deleted** — it's no longer in the
DNS path for anything. Wasn't deleted yet as of this writing, just
disconnected; low priority to actually remove it since it's already paused
and costs nothing sitting there unused.

**GitHub Actions workflows are unaffected by this migration** — they run on
GitHub's own runners regardless of hosting provider, see the section below.

**Netlify credit-exhaustion history, for context (now moot)**: Netlify ran
out of its free-tier deploy credits (300/month) on 2026-07-11, after 34
deploys in about 36 hours of active development, which is what prompted this
whole migration.

## GitHub Actions secrets — were never set, now fixed (2026-07-13)

`backup-firestore.yml` and `notify-subscribers.yml` had **failed on every
single run since they existed** — `gh secret list` showed zero secrets ever
configured on the repo, so both scripts died immediately on
`Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY`.
Practical effect: there had never been a successful nightly Firestore backup,
and subscribers had never received a digest email — not a regression, just
never wired up.

Fixed by setting 5 repo secrets: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY` (from local `.env.local`), `RESEND_API_KEY` (a new
"Sending access" key scoped to the `yuvrajsampath.com` domain, generated in
the Resend dashboard), and `RESEND_FROM_EMAIL` (`daily@yuvrajsampath.com`).
Both workflows were manually triggered afterward and confirmed working —
backup pushed a real commit (`9cb3081`), and notify actually sent a live
digest to 1 subscriber (the Firestore cursor doc already existed from an
earlier local test, so this wasn't the no-email "first run" case the script's
guard is meant for — worth knowing if a manual trigger is ever needed again,
don't assume it's automatically a no-op).

Reply-to note: `daily@yuvrajsampath.com` is a send-only address (Resend only
sends, it doesn't receive). Replies forwarding to `yuvrajsampath@gmail.com`
were set up separately via Squarespace's email forwarding (still the DNS
provider for this domain), not via Resend.

## Done: the Story → Short Story merge (2026-07-13, second and final attempt)

தூவானை (Story) has been folded into சிறு மயில் (Short Story) and no longer
exists as a category. First attempted earlier (commit `2dc0ebd`), but that
deploy hit the Netlify credit exhaustion and got skipped, so it was reverted
(`7d7ad88`) to keep the repo and live site in sync. Redone properly after the
Vercel migration, this time confirmed live end-to-end:

- Firestore: the one `writings` doc with `category == "story"`
  (`NSgCj8Hi04yR3pXBiEcl`) updated to `category: "shortstory"`.
- `src/lib/categories.ts`: `"story"` removed from `CategorySlug` and
  `CATEGORIES`; `shortstory` now has `hasAudio: true` (inherited from Story,
  so the audio upload feature isn't lost).
- `src/lib/mock-data.ts` and `src/app/page.tsx` (`PREVIEW_CATEGORIES`)
  updated to match.
- `next.config.ts` has permanent redirects `/story` → `/shortstory` and
  `/story/:path*` → `/shortstory/:path*`, so old links (including any already
  emailed to subscribers) keep working.
- Content-model tables in `docs/architecture.md` and
  `src/app/tirupur/architecture/page.tsx` updated to drop the `story` row and
  mark `shortstory`'s audio column `yes`.
- Verified via Playwright against a local dev server: nav no longer shows
  தூவானை, the migrated entry renders under சிறு மயில் with cover image and
  audio intact, and both `/story` and `/story/[id]` redirect correctly.

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
