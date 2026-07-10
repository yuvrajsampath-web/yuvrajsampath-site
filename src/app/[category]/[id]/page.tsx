import Link from "next/link";
import { notFound } from "next/navigation";
import { InnerHeader } from "@/components/InnerHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RichBody } from "@/components/RichBody";
import { EntryList } from "@/components/EntryList";
import { CATEGORY_BY_SLUG, isCategorySlug, isMonthKey, monthKeyLabel } from "@/lib/categories";
import { getArchive, getWriting } from "@/lib/data";
import { formatDate } from "@/lib/format";

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

  const writing = await getWriting(id);
  if (!writing || writing.category !== category) notFound();

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
      </main>
      <SiteFooter />
    </div>
  );
}
