import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InnerHeader } from "@/components/InnerHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RichBody } from "@/components/RichBody";
import { EntryList } from "@/components/EntryList";
import { CATEGORY_BY_SLUG, isCategorySlug, isMonthKey, monthKeyLabel } from "@/lib/categories";
import { getArchive } from "@/lib/data";
import { formatDate } from "@/lib/format";

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}): Promise<Metadata> {
  const { category, id } = await params;
  if (!isCategorySlug(category)) return {};
  const def = CATEGORY_BY_SLUG[category];

  if (def.paginated && isMonthKey(id)) {
    return { title: `${monthKeyLabel(id)} — ${def.english}` };
  }

  const entries = await getArchive(category);
  const writing = entries.find((w) => w.id === id);
  if (!writing) return {};

  const plainBody = def.format === "rich" ? stripHtml(writing.body) : writing.body.replace(/\n+/g, " ");
  const title = def.hasTitle && writing.title ? writing.title : plainBody.slice(0, 60);
  const description = plainBody.slice(0, 160);
  return { title, description, openGraph: { description }, twitter: { description } };
}

export default async function CategoryIdPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category, id } = await params;
  if (!isCategorySlug(category)) notFound();
  const def = CATEGORY_BY_SLUG[category];

  if (def.paginated && isMonthKey(id)) {
    const entries = (await getArchive(category)).filter((w) => w.publishedAt.startsWith(id));
    if (entries.length === 0) notFound();

    return (
      <div className="flex flex-col flex-1">
        <InnerHeader />
        <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
          <Link href={`/${def.slug}`} className="text-sm text-muted hover:text-amber transition-colors">
            ← {def.tamil}
          </Link>
          <h1 className="mt-4 font-display text-3xl">{monthKeyLabel(id)}</h1>
          <EntryList def={def} entries={entries} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const entries = await getArchive(category);
  const index = entries.findIndex((w) => w.id === id);
  if (index === -1) notFound();
  const writing = entries[index];
  const newer = index > 0 ? entries[index - 1] : null;
  const older = index < entries.length - 1 ? entries[index + 1] : null;

  return (
    <div className="flex flex-col flex-1">
      <InnerHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <Link href={`/${def.slug}`} className="text-sm text-muted hover:text-amber transition-colors">
          ← {def.tamil}
        </Link>

        <p className="mt-6 text-xs tracking-[0.2em] uppercase text-muted tabular-nums">
          {formatDate(writing.publishedAt, "long")}
          {writing.topic ? ` · ${writing.topic}` : ""}
        </p>
        {def.hasTitle && writing.title && (
          <h1 className="mt-2 font-display text-3xl sm:text-4xl text-balance">{writing.title}</h1>
        )}

        <div className="mt-8">
          {def.format === "rich" ? (
            <RichBody html={writing.body} />
          ) : (
            <p className="font-tamil-body text-xl leading-relaxed whitespace-pre-line">
              {writing.body}
            </p>
          )}
        </div>

        {writing.englishTranslation && (
          <p className="mt-8 font-display italic text-muted whitespace-pre-line border-t border-line pt-8">
            {writing.englishTranslation}
          </p>
        )}

        {(older || newer) && (
          <nav className="mt-12 flex items-center justify-between border-t border-line pt-6 text-sm">
            {older ? (
              <Link
                href={`/${def.slug}/${older.id}`}
                className="text-muted hover:text-amber transition-colors"
              >
                ← {formatDate(older.publishedAt)}
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link
                href={`/${def.slug}/${newer.id}`}
                className="text-muted hover:text-amber transition-colors"
              >
                {formatDate(newer.publishedAt)} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
