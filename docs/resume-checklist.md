# Resuming after the Netlify credit pause

Written 2026-07-12, when work paused because Netlify's free-tier deploy
credits ran out. The plan resets **2026-08-09**. This is what to check when
picking this back up — most of these logins are long-lived and probably
still work without re-entering anything, but verify rather than assume.

## 1. Netlify — the one that actually matters

This is why work paused, so check it first.

- Go to **app.netlify.com** → this site → **Current services / usage**.
- Confirm the credit balance actually reset (should show a fresh cycle, not
  still "0 remaining").
- If it hasn't reset yet, or you'd rather not wait further, you can add
  credits or upgrade from the same page — that's a payment action only you
  can take.
- Quick CLI check instead of the dashboard, if preferred:
  ```
  netlify status
  ```
  If this returns account info without prompting a login, the CLI session
  is still valid — nothing to redo.
- **Worth deciding**: the Netlify CLI on this machine is logged in as the
  *author's* account (`yuvrajsampath@gmail.com`), not yours. If that wasn't
  intentional, `netlify logout` then `netlify login` with your own account,
  then `netlify link` to reattach this project.

## 2. GitHub

- `git push` uses a token stored in macOS Keychain (`gh` CLI, account
  `yuvrajsampath-web`). This should keep working indefinitely unless the
  token was revoked. Quick check:
  ```
  gh auth status
  ```
- If it shows logged out, run `gh auth login` again (choose HTTPS, and let
  it configure the git credential helper).

## 3. Firebase

- **Admin SDK credentials** (used by scripts and by the site's server-side
  rendering) live in `.env.local` in this directory — **not in git**. If
  you're on the same machine, it's already there and nothing to do. If
  you're on a *different* machine, this file needs to be recreated (see
  `.env.local.example` for the shape) — you'll need the service account key
  from Firebase Console → Project settings → Service accounts.
- **Firebase Console** (for anything requiring the dashboard — e.g.
  publishing `firestore.rules`/`storage.rules` changes, which still can't be
  done via CLI) needs a normal Google account login at
  console.firebase.google.com, project `website-d60aa`. Browser sessions
  here tend to persist for a long time, but you may need to sign in again.

## 4. Resend

- Only needed if touching the email digest setup. Dashboard login is a
  normal email/password or SSO session at resend.com — sign in again if
  prompted.

## 5. Squarespace

- Only relevant if DNS ever needs touching (rare — the site itself has been
  fully off Squarespace since early on). Sign in again if needed.

## 6. Sanity-check the project itself before making changes

```
cd /Users/vtkm/yuvrajsampath
npm run lint
npm run build
```

If both pass cleanly, the codebase itself is in the same good state it was
left in. Then check `git log --oneline -5` matches what's expected — the
last commit before the pause was `d16e225` ("Add docs/project-status.md").

## 7. Then what

See `docs/project-status.md` for what's actually pending — most notably the
Story → Short Story category merge, which is fully specified there and
ready to redo once deploys work again. Confirm with the user it's still
wanted before doing it.
