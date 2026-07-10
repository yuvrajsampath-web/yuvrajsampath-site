import Link from "next/link";
import { notFound } from "next/navigation";
import { InnerHeader } from "@/components/InnerHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RichBody } from "@/components/RichBody";
import { CATEGORY_BY_SLUG, isCategorySlug } from "@/lib/categories";
import { getWriting } from "@/lib/data";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function WritingPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category, id } = await params;
  if (!isCategorySlug(category)) notFound();

  const def = CATEGORY_BY_SLUG[category];
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
          {formatDate(writing.publishedAt)}
          {writing.topic ? ` · ${writing.topic}` : ""}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl text-balance">{writing.title}</h1>

        <div className="mt-8">
          {def.format === "rich" ? (
            <RichBody html={writing.body} />
          ) : (
            <p className="font-tamil-body text-2xl leading-relaxed whitespace-pre-line">
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
