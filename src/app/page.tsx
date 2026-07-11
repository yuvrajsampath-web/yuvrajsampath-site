import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { HomeHero } from "@/components/HomeHero";
import { MoreWriting, type Preview } from "@/components/MoreWriting";
import { SiteFooter } from "@/components/SiteFooter";
import { CATEGORY_BY_SLUG } from "@/lib/categories";
import { getArchive, getLatestDaily, getMedia } from "@/lib/data";
import { stripHtml } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const latest = await getLatestDaily();
  if (!latest) return {};
  const description = latest.body.replace(/\n+/g, " ").slice(0, 160);
  return {
    description,
    openGraph: { description },
    twitter: { description },
  };
}

const PREVIEW_CATEGORIES = ["daily", "story", "poetry", "essay", "shortstory"] as const;
const PREVIEW_COUNT = 5;

export default async function HomePage() {
  const [latestDaily, mediaEntries, ...archives] = await Promise.all([
    getLatestDaily(),
    getMedia(),
    ...PREVIEW_CATEGORIES.map((c) => getArchive(c)),
  ]);

  const previews = Object.fromEntries(
    PREVIEW_CATEGORIES.map((category, i) => {
      const def = CATEGORY_BY_SLUG[category];
      const list: Preview[] = archives[i].slice(0, PREVIEW_COUNT).map((w) => ({
        id: w.id,
        title: def.hasTitle && w.title ? w.title : "",
        snippet: (def.format === "rich" ? stripHtml(w.body) : w.body).slice(0, 100),
        publishedAt: w.publishedAt,
      }));
      return [category, list];
    })
  ) as Record<(typeof PREVIEW_CATEGORIES)[number], Preview[]>;

  const media: Preview[] = mediaEntries.slice(0, PREVIEW_COUNT).map((m) => ({
    id: m.id,
    title: m.title,
    snippet: m.description ?? "",
    publishedAt: m.publishedAt,
  }));

  return (
    <div className="flex flex-col flex-1">
      <TopNav />
      <main className="flex-1">
        <HomeHero entry={latestDaily} />
        <MoreWriting previews={previews} media={media} />
      </main>
      <SiteFooter />
    </div>
  );
}
