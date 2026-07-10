import Link from "next/link";
import { notFound } from "next/navigation";
import { InnerHeader } from "@/components/InnerHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CATEGORY_BY_SLUG, isCategorySlug } from "@/lib/categories";
import { getArchive } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();

  const def = CATEGORY_BY_SLUG[category];
  const entries = await getArchive(category);

  return (
    <div className="flex flex-col flex-1">
      <InnerHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">{def.english}</p>
        <h1 className="mt-2 font-tamil-display text-4xl sm:text-5xl">{def.tamil}</h1>
        <p className="mt-3 text-muted max-w-prose">{def.birdMeaning}</p>

        {def.topicIndexed && (
          <Link
            href={`/${def.slug}/topics`}
            className="mt-4 inline-block text-sm text-amber hover:opacity-75 transition-opacity"
          >
            Browse by topic →
          </Link>
        )}

        <ol className="mt-10 space-y-8 border-t border-line pt-10">
          {entries.length === 0 && (
            <li className="text-muted">Nothing published here yet.</li>
          )}
          {entries.map((w) => (
            <li key={w.id}>
              <Link href={`/${def.slug}/${w.id}`} className="group block">
                <p className="text-xs tracking-[0.15em] uppercase text-muted tabular-nums">
                  {formatDate(w.publishedAt)}
                  {w.topic ? ` · ${w.topic}` : ""}
                </p>
                <h2 className="mt-1.5 font-display text-xl group-hover:text-amber transition-colors">
                  {w.title}
                </h2>
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
