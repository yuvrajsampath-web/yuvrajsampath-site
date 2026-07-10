import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InnerHeader } from "@/components/InnerHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CATEGORY_BY_SLUG, isCategorySlug } from "@/lib/categories";
import { getTopics } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategorySlug(category)) return {};
  return { title: `Topics — ${CATEGORY_BY_SLUG[category].english}` };
}

export default async function TopicsIndexPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();
  const def = CATEGORY_BY_SLUG[category];
  if (!def.topicIndexed) notFound();

  const topics = await getTopics(category);

  return (
    <div className="flex flex-col flex-1">
      <InnerHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <Link href={`/${def.slug}`} className="text-sm text-muted hover:text-amber transition-colors">
          ← {def.tamil}
        </Link>
        <h1 className="mt-4 font-display text-3xl">Topics</h1>

        <ul className="mt-8 flex flex-wrap gap-3">
          {topics.length === 0 && <li className="text-muted">No topics tagged yet.</li>}
          {topics.map((t) => (
            <li key={t}>
              <Link
                href={`/${def.slug}/topics/${encodeURIComponent(t)}`}
                className="inline-block rounded-full border border-line px-4 py-1.5 text-sm font-tamil-body hover:border-amber hover:text-amber transition-colors"
              >
                {t}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
