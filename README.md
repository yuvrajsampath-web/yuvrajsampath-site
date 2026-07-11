# யுவராஜ் சம்பத் — Yuvraj Sampath

Bilingual author site: a daily short piece, stories, poetry, essays and short
stories under five Tamil-named sections (see `src/lib/categories.ts`), plus
podcasts/videos, publishable entirely from a hidden portal with no code or
git required. Full architecture writeup: the artifact shared in chat — ask
for a link if you need it again.

## Stack

- **Next.js** (App Router, TypeScript, Tailwind v4) — the whole site, public pages and portal alike
- **Netlify** — hosting + CI/CD, deploys automatically on push to `main`
- **Firebase** — Firestore (data), Auth (portal login), Storage (cover images) — free Spark tier, no billing account needed
- **GitHub Actions** — nightly Firestore backup (see `scripts/backup-firestore.mjs`)

Public pages read Firestore server-side via the **Admin SDK** (`src/lib/data.ts`) —
visitor browsers never load Firebase. Only the hidden portal talks to Firebase
directly, client-side, from behind a login.

## Local development

```bash
npm install
npm run dev
```

Without any Firebase env vars set, the site runs on local mock data
(`src/lib/mock-data.ts`) so every page is browsable immediately. The portal
will show "Firebase isn't connected yet" until you complete the setup below.

## Setting up Firebase (one-time)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Firestore**: create a database (production mode, any region close to your users).
3. **Authentication**: enable the *Email/Password* sign-in method, then add one user — the author's email and a password. Copy that user's **UID** from the Users table.
4. Paste the UID into `firestore.rules` and `storage.rules`, replacing `AUTHOR_UID`, then deploy the rules:
   ```bash
   npx firebase-tools deploy --only firestore:rules,storage:rules
   ```
5. **Storage**: enable it (for story cover images).
6. **Client config**: Project settings → General → Your apps → add a Web app. Copy the values into `.env.local` (copy `.env.local.example` first) as the `NEXT_PUBLIC_FIREBASE_*` vars. Also set `NEXT_PUBLIC_AUTHOR_EMAIL` to the email from step 3.
7. **Admin credentials**: Project settings → Service accounts → Generate new private key. Downloads a JSON file — copy `project_id`, `client_email`, and `private_key` into the `FIREBASE_*` (no `NEXT_PUBLIC_` prefix) vars in `.env.local`. Keep this file out of git.

Restart `npm run dev` after editing `.env.local`.

## Connecting the domain (Squarespace → Netlify)

Squarespace stays the registrar only — no site is built there.

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from GitHub**, pick this repo. Build command `npm run build`, publish directory `.next` (Netlify's Next.js runtime handles the rest).
3. Add the same `.env.local` variables under **Site settings → Environment variables**.
4. **Domain settings → Add a domain** → `yuvrajsampath.com`. Netlify shows the DNS records to set.
5. In Squarespace: **Domains → yuvrajsampath.com → DNS settings**, add the records Netlify gave you (usually an ALIAS/ANAME for the root and a CNAME for `www`).

## The hidden portal

URL: `/nest-4x7q` (see `src/lib/portal-config.ts` — rename the folder to change it; the real security is Firebase Auth + the rules above, not the URL). It's excluded from search engines via `src/app/robots.ts`.

Sign in with the email/password from setup step 3. From there: add/edit/delete any of the five writing sections or a podcast/video — no code, no git, no deploy.

## Nightly backups

`.github/workflows/backup-firestore.yml` exports Firestore to `backups/<date>/*.json` and commits it, every night. Add these repo secrets (Settings → Secrets and variables → Actions) using the same admin values as `.env.local`: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

## Email notifications (Resend)

Visitors can subscribe from the site footer (stored in Firestore's `subscribers`
collection — write-only from the client's perspective; only `/api/subscribe` and
`/api/unsubscribe`, both Admin SDK, can touch it). `.github/workflows/notify-subscribers.yml`
runs daily, checks for anything published since its last run, and emails the
subscriber list via [Resend](https://resend.com) — no new hosting, same pattern
as the nightly backup.

Setup:

1. Create a Resend account, then **Domains → Add domain** → `yuvrajsampath.com`. It shows DNS records (SPF/DKIM) — add them in Squarespace's DNS settings the same way as the Netlify records.
2. Once verified, **API Keys → Create API Key**.
3. Decide a from-address on the verified domain, e.g. `updates@yuvrajsampath.com`.
4. Add two repo secrets (Settings → Secrets and variables → Actions): `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

The first run just initializes a cursor and sends nothing (so it never floods
subscribers with the entire back catalog) — from then on, only genuinely new
entries trigger an email. Free tier: 3,000 emails/month, 100/day.

### Auto-unsubscribing inactive subscribers

To stay under the 100/day cap, subscribers who go 10 consecutive sends without
opening an email are automatically removed (checked right before each send).
This needs open tracking wired up, which is separate from the steps above:

1. **Domain settings in Resend → enable Open Tracking** for `yuvrajsampath.com`.
2. **Webhooks → Add Endpoint** → URL `https://yuvrajsampath.com/api/webhooks/resend`, subscribe to at least the `email.opened` event. Creating it shows a signing secret (`whsec_...`) — copy it.
3. Add that as an environment variable in **Netlify** (not a GitHub secret — this one's read by the deployed site, not the Action): `RESEND_WEBHOOK_SECRET`.

"10 in a row" means 10 consecutive *sent* digests, not calendar days — since a
digest only goes out on days something new is published, this is the same
thing in practice for a near-daily writer, and it avoids the edge cases of
counting quiet weeks against someone.

## Not yet built

- Bilingual EN/தமிழ் toggle for the wider profile pages (About, Ventures, etc.) — only the daily entry currently does Tamil-primary + English gloss.
- `hreflang` tags / per-language sitemap.
- Static profile pages (About, Journey, Ventures, Meendum Trust, Sustainability, Media, Gallery) from the original brief — this build covers the five writing sections, media, and the portal only.
