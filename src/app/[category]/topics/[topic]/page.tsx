import Link from "next/link";
import { notFound } from "next/navigation";
import { InnerHeader } from "@/components/InnerHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CATEGORY_BY_SLUG, isCategorySlug } from "@/lib/categories";
import { getByTopic } from "@/lib/data";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ category: string; topic: string }>;
}) {
  const { category, topic } = await params;
  if (!isCategorySlug(category)) notFound();
  const def = CATEGORY_BY_SLUG[category];
  if (!def.topicIndexed) notFound();

  const decodedTopic = decodeURIComponent(topic);
  const entries = await getByTopic(category, decodedTopic);

  return (
    <div className="flex flex-col flex-1">
      <InnerHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <Link href={`/${def.slug}/topics`} className="text-sm text-muted hover:text-amber transition-colors">
          ← Topics
        </Link>
        <h1 className="mt-4 font-tamil-display text-3xl">{decodedTopic}</h1>

        <ol className="mt-8 space-y-8 border-t border-line pt-8">
          {entries.length === 0 && <li className="text-muted">Nothing tagged here yet.</li>}
          {entries.map((w) => (
            <li key={w.id}>
              <Link href={`/${def.slug}/${w.id}`} className="group block">
                <p className="text-xs tracking-[0.15em] uppercase text-muted tabular-nums">
                  {formatDate(w.publishedAt)}
                </p>
                <p className="mt-1.5 font-tamil-body text-lg group-hover:text-amber transition-colors whitespace-pre-line">
                  {w.body.split("\n")[0]}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
