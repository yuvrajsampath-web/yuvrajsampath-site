import Link from "next/link";
import type { CategoryDef } from "@/lib/categories";
import type { Writing } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function EntryList({ def, entries }: { def: CategoryDef; entries: Writing[] }) {
  if (entries.length === 0) {
    return <p className="mt-10 border-t border-line pt-10 text-muted">Nothing published here yet.</p>;
  }

  return (
    <ol className="mt-10 border-t border-line divide-y divide-line">
      {entries.map((w) => (
        <li key={w.id} className="py-6">
          <Link href={`/${def.slug}/${w.id}`} className="group block">
            <p className="text-xs tracking-[0.15em] uppercase text-muted tabular-nums">
              {formatDate(w.publishedAt)}
              {w.topic ? ` · ${w.topic}` : ""}
            </p>
            {def.hasTitle ? (
              <h2 className="mt-1.5 font-display text-xl group-hover:text-amber transition-colors">
                {w.title}
              </h2>
            ) : (
              <p className="mt-1.5 font-tamil-body text-base leading-relaxed whitespace-pre-line group-hover:text-amber transition-colors">
                {w.body}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
