import Link from "next/link";
import Image from "next/image";
import type { Writing } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function HomeHero({ entry }: { entry: Writing | null }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-14 sm:py-20 md:grid-cols-2 md:items-center">
      <div>
        <p className="flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-amber">
          <span className="inline-block h-px w-6 bg-amber" />
          Today&apos;s குறிஞ்சிட்டு
        </p>

        {entry ? (
          <>
            <p className="mt-5 font-tamil-body text-xl sm:text-2xl leading-relaxed whitespace-pre-line text-balance">
              {entry.body}
            </p>
            <p className="mt-4 text-xs uppercase tracking-wide text-muted">
              {formatDate(entry.publishedAt)}
              {entry.topic ? ` · ${entry.topic}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-5 text-muted">This entry will appear here once published.</p>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/daily"
            className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-ink transition-opacity hover:opacity-90"
          >
            Browse the archive →
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
          <div className="absolute inset-x-0 bottom-0 bg-[#2a1410]/80 px-4 py-2 text-center">
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-white">
              Entrepreneur · Advocate · Author
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
