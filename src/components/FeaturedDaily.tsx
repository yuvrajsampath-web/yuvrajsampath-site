import Link from "next/link";
import type { Writing } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function FeaturedDaily({ entry }: { entry: Writing | null }) {
  return (
    <section id="today" className="border-y border-line bg-surface px-6 py-16 sm:py-20 scroll-mt-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="flex items-center justify-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-muted">
          <span className="inline-block h-px w-6 bg-amber" />
          Today&apos;s குறிஞ்சிட்டு
        </p>

        {entry ? (
          <>
            <p className="mt-6 font-tamil-body text-xl sm:text-2xl leading-relaxed whitespace-pre-line">
              {entry.body}
            </p>
            {entry.englishTranslation && (
              <p className="mt-5 font-display italic text-base text-muted whitespace-pre-line">
                {entry.englishTranslation}
              </p>
            )}
            <p className="mt-6 text-xs uppercase tracking-wide text-muted">
              {formatDate(entry.publishedAt)}
              {entry.topic ? ` · ${entry.topic}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-6 text-muted">This entry will appear here once published.</p>
        )}

        <Link
          href="/daily"
          className="mt-8 inline-block font-body text-sm tracking-wide text-amber transition-opacity hover:opacity-75"
        >
          Read the archive →
        </Link>
      </div>
    </section>
  );
}
