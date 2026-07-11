import Link from "next/link";
import Image from "next/image";

export function HomeHero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-14 sm:py-20 md:grid-cols-2 md:items-center">
      <div>
        <p className="flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-amber">
          <span className="inline-block h-px w-6 bg-amber" />
          Entrepreneur · Sustainability Advocate · Bilingual Author
        </p>
        <h1 className="mt-5 font-tamil-display text-4xl sm:text-5xl leading-tight text-balance">
          நாள்தோறும் <span className="text-amber">ஒரு வரி.</span>
        </h1>
        <p className="mt-2 font-display italic text-lg text-muted">A line, every day.</p>
        <p className="mt-5 max-w-prose text-muted">
          Four decades in business and sustainability advocacy — and for the past two years, a
          haiku every single day. Stories, essays and poetry, in Tamil and English.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#today"
            className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-ink transition-opacity hover:opacity-90"
          >
            See today&apos;s குறிஞ்சிட்டு ↓
          </a>
          <Link
            href="/daily"
            className="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-amber hover:text-amber"
          >
            Browse the archive
          </Link>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-xs md:max-w-sm">
        <div className="absolute inset-0 rotate-2 rounded-2xl bg-amber/60" aria-hidden />
        <div className="relative -rotate-1 overflow-hidden rounded-2xl border-4 border-paper shadow-xl">
          <Image
            src="/author.jpg"
            alt="M. M. Sampath Kumar"
            width={1122}
            height={1402}
            priority
            className="h-auto w-full"
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-2 text-center">
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-white">
              Entrepreneur · Advocate · Author
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
