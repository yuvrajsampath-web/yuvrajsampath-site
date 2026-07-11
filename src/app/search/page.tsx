import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchClient, type SearchItem } from "@/components/SearchClient";
import { CATEGORY_BY_SLUG } from "@/lib/categories";
import { getAllWritings } from "@/lib/data";
import { stripHtml } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage() {
  const writings = await getAllWritings();

  const items: SearchItem[] = writings.map((w) => {
    const def = CATEGORY_BY_SLUG[w.category];
    const plain = def.format === "rich" ? stripHtml(w.body) : w.body;
    return {
      id: w.id,
      category: w.category,
      title: def.hasTitle && w.title ? w.title : "",
      snippet: plain.slice(0, 200),
      publishedAt: w.publishedAt,
    };
  });

  return (
    <div className="flex flex-col flex-1">
      <TopNav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <h1 className="font-display text-3xl sm:text-4xl">Search</h1>
        <div className="mt-8">
          <SearchClient items={items} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
