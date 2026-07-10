import Link from "next/link";
import { notFound } from "next/navigation";
import { InnerHeader } from "@/components/InnerHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EntryList } from "@/components/EntryList";
import { CATEGORY_BY_SLUG, isCategorySlug, monthKeyLabel } from "@/lib/categories";
import { getArchive } from "@/lib/data";
import type { Writing } from "@/lib/types";

export const dynamic = "force-dynamic";

function groupByMonth(entries: Writing[]) {
  const counts = new Map<string, number>();
  for (const w of entries) {
    const key = w.publishedAt.slice(0, 7); // YYYY-MM
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([monthKey, count]) => ({ monthKey, count }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
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
  const months = def.paginated ? groupByMonth(entries) : [];

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

        {def.paginated ? (
          months.length === 0 ? (
            <p className="mt-10 border-t border-line pt-10 text-muted">Nothing published here yet.</p>
          ) : (
            <ul className="mt-10 border-t border-line divide-y divide-line">
              {months.map((m) => (
                <li key={m.monthKey} className="py-4">
                  <Link
                    href={`/${def.slug}/${m.monthKey}`}
                    className="group flex items-baseline justify-between"
                  >
                    <span className="font-display text-lg group-hover:text-amber transition-colors">
                      {monthKeyLabel(m.monthKey)}
                    </span>
                    <span className="text-sm text-muted tabular-nums">{m.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : (
          <EntryList def={def} entries={entries} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
