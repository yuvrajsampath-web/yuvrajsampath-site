import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { DailyFeature } from "@/components/DailyFeature";
import { SiteFooter } from "@/components/SiteFooter";
import { getLatestDaily } from "@/lib/data";

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

export default async function HomePage() {
  const latest = await getLatestDaily();

  return (
    <main className="flex flex-col flex-1">
      <Hero />
      <DailyFeature entry={latest} />
      <SiteFooter />
    </main>
  );
}
