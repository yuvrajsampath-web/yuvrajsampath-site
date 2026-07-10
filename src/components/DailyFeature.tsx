import Link from "next/link";
import type { Writing } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DailyFeature({ entry }: { entry: Writing | null }) {
  if (!entry) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16 text-muted">
        <p>The first குறிஞ்சிட்டு entry will appear here once published.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <p className="font-body text-xs tracking-[0.2em] uppercase text-muted">
        {formatDate(entry.publishedAt)}
        {entry.topic ? ` · ${entry.topic}` : ""}
      </p>
      <p className="mt-8 font-tamil-body text-2xl sm:text-3xl leading-relaxed whitespace-pre-line">
        {entry.body}
      </p>
      {entry.englishTranslation ? (
        <p className="mt-6 font-display italic text-base sm:text-lg text-muted whitespace-pre-line">
          {entry.englishTranslation}
        </p>
      ) : null}
      <Link
        href="/daily"
        className="mt-10 inline-block font-body text-sm tracking-wide text-amber hover:opacity-75 transition-opacity"
      >
        Read the archive →
      </Link>
    </section>
  );
}
