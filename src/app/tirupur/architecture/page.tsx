import type { Metadata } from "next";
import Link from "next/link";
import { PORTAL_PATH } from "@/lib/portal-config";

export const metadata: Metadata = {
  title: "Architecture — Portal",
  robots: { index: false, follow: false },
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-line pt-8">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line border-l-[3px] border-l-amber bg-surface px-5 py-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-amber">{label}</p>
      <div className="mt-1.5 text-sm text-muted">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-line bg-paper px-1.5 py-0.5 text-[0.85em] text-ink">
      {children}
    </code>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-surface px-4 py-3.5">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber" />
        {title}
      </h4>
      <p className="mt-1.5 text-sm text-muted">{children}</p>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="pb-16">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber">
        <span className="inline-block h-px w-6 bg-amber" />
        Architecture
      </p>
      <h1 className="mt-2 font-display text-3xl text-balance">How this site is built</h1>
      <p className="mt-2 max-w-prose text-muted">
        A from-scratch walkthrough for whoever touches this project next — including the login
        inventory, kept here rather than in the public repo or anywhere unauthenticated.
      </p>

      <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {[
          ["overview", "Overview"],
          ["map", "System map"],
          ["content", "Content model"],
          ["rendering", "Rendering & SDKs"],
          ["routes", "Routes"],
          ["portal", "The portal"],
          ["logins", "Logins & credentials"],
          ["email", "Email"],
          ["deploy", "Deploy"],
          ["why", "Why"],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="hover:text-amber transition-colors">
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-8">
        <Section id="overview" title="What this site is">
          <p>
            A bilingual (Tamil/English) author site for M. M. Sampath Kumar (Yuvraj Sampath).
            Five writing categories plus a media (podcast/video) section, each carrying a Tamil
            bird name as its identity. This portal lets the author publish new writing himself —
            no git, no code.
          </p>
          <Callout label="The one constraint that shapes everything">
            Stay on Firebase&apos;s free Spark plan. No Cloud Functions, no Blaze billing.
            Everything that would normally be a Firebase Function is instead a Netlify
            serverless function or a scheduled GitHub Action.
          </Callout>
        </Section>

        <Section id="map" title="System map">
          <p>
            The Next.js app renders public pages by reading Firestore directly, server-side,
            with the Admin SDK — there&apos;s no separate API layer for the public site.
          </p>
          <div className="rounded-md border border-line bg-surface px-5 py-5 text-sm">
            <p>
              <Pill>Squarespace</Pill> (DNS only) → <Pill>Netlify</Pill> (hosting + CI/CD) ←
              builds from ← <Pill>GitHub</Pill> (source)
            </p>
            <p className="mt-3">
              GitHub Actions (cron, independent of visitor traffic):
            </p>
            <ul className="ml-4 mt-1 list-disc space-y-1">
              <li>
                <Pill>backup-firestore</Pill> nightly → JSON export of <Pill>Firebase</Pill>
              </li>
              <li>
                <Pill>notify-subscribers</Pill> daily digest → <Pill>Resend</Pill>
              </li>
            </ul>
            <p className="mt-3">
              Resend also calls back into the site via <Pill>/api/webhooks/resend</Pill> to
              report opens.
            </p>
          </div>
        </Section>

        <Section id="content" title="Content model">
          <p>
            Every piece of writing is one <Pill>Writing</Pill> document in Firestore, tagged
            with a <Pill>category</Pill>. Behavior differs by looking up{" "}
            <strong className="text-ink">category-level flags</strong>, never by checking
            whether a field happens to be present on a document.
          </p>
          <Callout label="A rule earned the hard way">
            A legacy <Pill>title</Pill> field left over on a <Pill>daily</Pill> entry once made
            it render wrong in five places, until every check switched from{" "}
            <Pill>if (w.title)</Pill> to <Pill>if (def.hasTitle && w.title)</Pill>. Display logic
            reads <Pill>CATEGORY_BY_SLUG[slug]</Pill>, never raw field presence.
          </Callout>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="border-b border-line pb-2 pr-4">Slug</th>
                  <th className="border-b border-line pb-2 pr-4">Tamil</th>
                  <th className="border-b border-line pb-2 pr-4">Format</th>
                  <th className="border-b border-line pb-2 pr-4">Title?</th>
                  <th className="border-b border-line pb-2 pr-4">Topics?</th>
                  <th className="border-b border-line pb-2">Audio?</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["daily", "குறிஞ்சிட்டு", "plain", "no", "yes", "no"],
                  ["story", "தூவானை", "rich", "yes", "no", "yes"],
                  ["poetry", "முருகு சிட்டு", "plain", "yes", "no", "no"],
                  ["essay", "அன்னம்", "rich", "yes", "no", "no"],
                  ["shortstory", "சிறு மயில்", "rich", "yes", "no", "no"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-line">
                    <td className="py-2 pr-4 font-mono text-xs">{row[0]}</td>
                    <td className="py-2 pr-4 font-tamil-body">{row[1]}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{row[2]}</td>
                    <td className="py-2 pr-4">{row[3]}</td>
                    <td className="py-2 pr-4">{row[4]}</td>
                    <td className="py-2">{row[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Media (podcasts/videos, குயில்) is a separate Firestore collection/type, not a
            sixth category — it has a <Pill>kind</Pill> (<Pill>podcast</Pill>/<Pill>video</Pill>
            ), a <Pill>url</Pill>, and an optional description.
          </p>
        </Section>

        <Section id="rendering" title="Rendering & the two Firebase SDKs">
          <p className="text-ink">This is the one architectural line that matters most.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card title="Admin SDK — firebase/admin.ts">
              Server-only. Used by every public page to read Firestore. Full read access, never
              shipped to the browser.
            </Card>
            <Card title="Client SDK — firebase/client.ts">
              Used only inside this portal. Runs in the author&apos;s browser, gated by Firebase
              Auth + security rules — not by keeping anything secret.
            </Card>
          </div>
          <p>
            Reads are wrapped in React&apos;s <Pill>cache()</Pill> so a page and its metadata
            share one Firestore read per request, and fall back to mock data if Admin
            credentials aren&apos;t configured. Pages showing live content are marked{" "}
            <Pill>force-dynamic</Pill> — without it, new posts wouldn&apos;t appear until the
            next deploy.
          </p>
        </Section>

        <Section id="routes" title="Route map">
          <pre className="overflow-x-auto rounded-md border border-line bg-surface p-4 text-xs leading-relaxed">
{`/                              Homepage
/reveal                        Standalone splash/title-card page
/about                         Author bio
/search                        Client-side fuzzy search
/rss.xml                       RSS feed

/[category]                    Archive for a writing category
/[category]/[id]               One entry (daily: a /YYYY-MM month page)
/[category]/topics[/topic]     Topic index (daily only)

/media                         குயில் — podcasts & videos

/${PORTAL_PATH}                       This portal
/${PORTAL_PATH}/writings/new          New writing
/${PORTAL_PATH}/writings/[id]/edit    Edit a writing
/${PORTAL_PATH}/media/new             New podcast/video
/${PORTAL_PATH}/media/[id]/edit       Edit a media entry
/${PORTAL_PATH}/architecture          This page

/api/subscribe · /api/unsubscribe · /api/webhooks/resend`}
          </pre>
        </Section>

        <Section id="portal" title="This portal">
          <p>
            <Pill>lib/portal-config.ts</Pill> holds the one thing that makes it &quot;hidden&quot;:
            the route segment name. Changing it is a folder rename + redeploy, not a config
            toggle — deliberately, so it can&apos;t be flipped by accident.{" "}
            <Pill>robots.ts</Pill> disallows it from search indexing using the same constant.
          </p>
          <Callout label="The URL is a courtesy, not the lock">
            Real access control is Firebase Auth (signed-in email must match the configured
            author email) plus Firestore/Storage security rules, which gate every write on the
            author&apos;s UID server-side, regardless of what the client claims.
          </Callout>
          <p>
            Publishing flow: the writing form → optional cover image / audio upload straight to
            Firebase Storage from the browser → the Firestore document is written directly from
            the browser, under Auth + rules, with no server in between.
          </p>
        </Section>

        <Section id="logins" title="Logins & credentials">
          <p>
            Every account and credential involved in running this site. Kept here, behind
            sign-in, rather than in the public repo or anywhere unauthenticated.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="border-b border-line pb-2 pr-4">Login</th>
                  <th className="border-b border-line pb-2 pr-4">Used for</th>
                  <th className="border-b border-line pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Firebase Console",
                    "Managing Firestore, Auth users, Storage, publishing rules",
                    "Google account · project website-d60aa",
                  ],
                  [
                    "GitHub",
                    "Source control",
                    "yuvrajsampath-web/yuvrajsampath-site",
                  ],
                  [
                    "Netlify",
                    "Hosting dashboard, deploy env vars",
                    "CLI session on the dev machine",
                  ],
                  [
                    "Squarespace",
                    "Domain registrar / DNS only",
                    "No site content here anymore",
                  ],
                  [
                    "Resend",
                    "Transactional email dashboard",
                    "Subscriber digest, DKIM/domain setup",
                  ],
                  [
                    "This portal",
                    "The actual writing/publishing tool",
                    "Firebase Auth, yuvrajsampath@gmail.com, single allowed UID",
                  ],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-line align-top">
                    <td className="py-2.5 pr-4 font-medium text-ink">{row[0]}</td>
                    <td className="py-2.5 pr-4">{row[1]}</td>
                    <td className="py-2.5 text-muted">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-display text-base text-ink">Machine-to-machine credentials</h3>
          <p className="text-sm">No human logs in with these — they&apos;re API keys / service accounts.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="border-b border-line pb-2 pr-4">Credential</th>
                  <th className="border-b border-line pb-2 pr-4">Purpose</th>
                  <th className="border-b border-line pb-2">Stored in</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Firebase Admin SDK service account",
                    "Server-side Firestore reads, GitHub Actions",
                    ".env.local (gitignored) + GitHub Actions secrets",
                  ],
                  [
                    "Firebase Client SDK config",
                    "Portal browser code",
                    ".env.local + Netlify env vars (meant to be public)",
                  ],
                  [
                    "RESEND_API_KEY / RESEND_FROM_EMAIL",
                    "Daily subscriber digest",
                    "GitHub Actions secrets only",
                  ],
                  [
                    "Netlify site link",
                    "Local CLI ↔ site association",
                    "Local machine only, gitignored",
                  ],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-line align-top">
                    <td className="py-2.5 pr-4 font-medium text-ink">{row[0]}</td>
                    <td className="py-2.5 pr-4">{row[1]}</td>
                    <td className="py-2.5 text-muted">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout label="Rotating anything">
            The Firebase Admin key and the Resend API key are the two that need updating in both
            <Pill> .env.local</Pill> and GitHub Actions secrets if ever rotated.
          </Callout>
        </Section>

        <Section id="email" title="Email & subscribers">
          <p>
            Subscriber emails live in Firestore, written only via <Pill>/api/subscribe</Pill>{" "}
            using the Admin SDK — never directly from the browser. Sending is entirely via
            GitHub Actions, not Firebase.
          </p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              <strong className="text-ink">notify-subscribers</strong> runs daily, reads
              everything published since a Firestore-stored cursor (not{" "}
              <Pill>createdAt</Pill> directly — this stops a new subscriber getting the whole
              back-catalog at once) and sends via Resend.
            </li>
            <li>
              <strong className="text-ink">/api/webhooks/resend</strong> receives delivery/open
              events (Svix-verified); an entry unopened for 10 consecutive days is auto-removed
              — Resend&apos;s free tier caps at 100 emails/day.
            </li>
            <li>
              <strong className="text-ink">backup-firestore</strong> runs nightly, exporting
              every document to JSON — Firestore has no built-in undo; this is that undo.
            </li>
          </ul>
        </Section>

        <Section id="deploy" title="Deploy pipeline">
          <p>
            Push to <Pill>main</Pill> → Netlify picks it up automatically → build → deployed.
            No manual step in normal operation.
          </p>
          <Callout label="Caveat that&apos;s bitten this project before">
            <Pill>firestore.rules</Pill> and <Pill>storage.rules</Pill> are{" "}
            <strong className="text-ink">not</strong> part of this deploy — the CLI path is
            currently broken (IAM permissions). Any change to either file needs to be pasted
            manually into the Firebase console after merging.
          </Callout>
        </Section>

        <Section id="why" title="Why things are the shape they are">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card title="No Cloud Functions anywhere">
              Netlify + GitHub Actions instead, so Firebase stays on the free Spark plan.
            </Card>
            <Card title="Category flags, not field presence">
              Avoids the class of bug where one document with a stray field renders differently
              from its siblings.
            </Card>
            <Card title="force-dynamic on content pages">
              Without it, new posts wouldn&apos;t appear until the next deploy.
            </Card>
            <Card title="Portal writes go browser → Firestore directly">
              No API route — the security boundary is Firebase Auth + rules, not a server we&apos;d
              otherwise have to host.
            </Card>
          </div>
        </Section>
      </div>

      <p className="mt-12 border-t border-line pt-6 text-center text-xs text-muted">
        See also <Pill>docs/architecture.md</Pill> in the repo — the public-safe version of
        this document, without the logins table.{" "}
        <Link href={`/${PORTAL_PATH}`} className="text-amber hover:opacity-75 transition-opacity">
          ← Back to portal
        </Link>
      </p>
    </div>
  );
}
