import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function BirdNav({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      aria-label="Sections"
      className={
        compact
          ? "flex flex-wrap items-baseline gap-x-6 gap-y-2"
          : "flex flex-wrap justify-center items-baseline gap-x-8 gap-y-3"
      }
    >
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/${c.slug}`}
          className={
            compact
              ? "group flex flex-col leading-tight"
              : "group flex flex-col items-center leading-tight text-center"
          }
        >
          <span
            className={
              (compact ? "text-base " : "text-lg sm:text-xl ") +
              "font-tamil-body font-medium text-current transition-colors group-hover:text-amber"
            }
          >
            {c.tamil}
          </span>
          <span className="text-[0.65rem] tracking-[0.14em] uppercase text-current/60 group-hover:text-amber/80 transition-colors">
            {c.english}
          </span>
        </Link>
      ))}
    </nav>
  );
}
