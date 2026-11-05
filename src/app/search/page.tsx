import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchClient } from "@/components/SearchClient";
import { getSearchableWritings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage() {
  const items = await getSearchableWritings();

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
