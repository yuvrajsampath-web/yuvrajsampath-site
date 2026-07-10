import { Hero } from "@/components/Hero";
import { DailyFeature } from "@/components/DailyFeature";
import { SiteFooter } from "@/components/SiteFooter";
import { getLatestDaily } from "@/lib/data";

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
