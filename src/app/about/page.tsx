import type { Metadata } from "next";
import Image from "next/image";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "About — Yuvraj Sampath",
  description: "Entrepreneur, sustainability advocate, and bilingual author.",
};

function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-md border border-dashed border-line bg-surface/60 px-4 py-3 text-sm text-muted">
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1">
      <TopNav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">About</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-balance">
          M. M. Sampath Kumar
        </h1>
        <p className="mt-1 font-tamil-body text-lg text-muted">யுவராஜ் சம்பத்</p>

        <div className="mt-10 w-full max-w-xs overflow-hidden rounded-md border border-line">
          <Image
            src="/author.jpg"
            alt="M. M. Sampath Kumar"
            width={1122}
            height={1402}
            priority
            className="h-auto w-full"
          />
        </div>

        <section className="mt-12 space-y-10">
          <div>
            <h2 className="font-display text-xl">Early life &amp; education</h2>
            <PlaceholderNote>
              Draft text goes here — early life, upbringing, and education.
            </PlaceholderNote>
          </div>

          <div>
            <h2 className="font-display text-xl">Four decades of entrepreneurship</h2>
            <PlaceholderNote>
              Draft text goes here — textile entrepreneurship, export leadership, industry
              associations, advisory roles.
            </PlaceholderNote>
          </div>

          <div>
            <h2 className="font-display text-xl">Sustainability &amp; present work</h2>
            <PlaceholderNote>
              Draft text goes here — the transition to sustainability advocacy, Meendum Trust,
              and current initiatives.
            </PlaceholderNote>
          </div>

          <div>
            <h2 className="font-display text-xl">On writing</h2>
            <PlaceholderNote>
              Draft text goes here — why the daily practice, what the bird names mean, the
              bilingual approach.
            </PlaceholderNote>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
