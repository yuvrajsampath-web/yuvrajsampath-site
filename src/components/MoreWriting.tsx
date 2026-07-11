import Link from "next/link";
import { CATEGORY_BY_SLUG, type CategorySlug } from "@/lib/categories";
import { formatDate } from "@/lib/format";

export interface Preview {
  id: string;
  title: string;
  snippet: string;
  publishedAt: string;
}

type NonDaily = Exclude<CategorySlug, "daily">;

export function MoreWriting({
  previews,
  media,
}: {
  previews: Record<NonDaily, Preview[]>;
  media?: Preview[];
}) {
  const categories = Object.keys(previews) as NonDaily[];
  const latestMedia = media?.[0];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-amber">
        <span className="inline-block h-px w-6 bg-amber" />
        More
      </p>

      <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2">
        {categories.map((category) => {
          const def = CATEGORY_BY_SLUG[category];
          const latest = previews[category][0];
          return (
            <div key={category}>
              <Link href={`/${category}`} className="group flex items-baseline gap-2">
                <span className="font-tamil-body text-lg group-hover:text-amber transition-colors">
                  {def.tamil}
                </span>
                <span className="text-xs tracking-[0.1em] uppercase text-muted">{def.english}</span>
              </Link>
              {latest ? (
                <Link href={`/${category}/${latest.id}`} className="group mt-2 block">
                  <p className="text-xs uppercase tracking-wide text-muted tabular-nums">
                    {formatDate(latest.publishedAt)}
                  </p>
                  <p className="mt-1 font-display text-base group-hover:text-amber transition-colors">
                    {latest.title || latest.snippet}
                  </p>
                </Link>
              ) : (
                <p className="mt-2 text-sm text-muted">Nothing published here yet.</p>
              )}
            </div>
          );
        })}

        <div>
          <Link href="/media" className="group flex items-baseline gap-2">
            <span className="font-tamil-body text-lg group-hover:text-amber transition-colors">
              குயில்
            </span>
            <span className="text-xs tracking-[0.1em] uppercase text-muted">Media</span>
          </Link>
          {latestMedia ? (
            <Link href="/media" className="group mt-2 block">
              <p className="text-xs uppercase tracking-wide text-muted tabular-nums">
                {formatDate(latestMedia.publishedAt)}
              </p>
              <p className="mt-1 font-display text-base group-hover:text-amber transition-colors">
                {latestMedia.title || latestMedia.snippet}
              </p>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted">Nothing published here yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
