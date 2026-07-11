import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { EntryList } from "@/components/EntryList";
import { CATEGORY_BY_SLUG, isCategorySlug } from "@/lib/categories";
import { getByTopic } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; topic: string }>;
}): Promise<Metadata> {
  const { category, topic } = await params;
  if (!isCategorySlug(category)) return {};
  return { title: `${decodeURIComponent(topic)} — ${CATEGORY_BY_SLUG[category].english}` };
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
      <TopNav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <Link href={`/${def.slug}/topics`} className="text-sm text-muted hover:text-amber transition-colors">
          ← Topics
        </Link>
        <h1 className="mt-4 font-tamil-display text-3xl">{decodedTopic}</h1>
        <EntryList def={def} entries={entries} />
      </main>
      <SiteFooter />
    </div>
  );
}
