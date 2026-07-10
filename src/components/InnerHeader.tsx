import Link from "next/link";
import { BirdNav } from "./BirdNav";
import { ThemeToggle } from "./ThemeToggle";

export function InnerHeader() {
  return (
    <header className="border-b border-line px-6 py-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-baseline gap-4 shrink-0">
        <Link href="/" className="font-tamil-body text-lg font-medium">
          யுவராஜ் சம்பத்
        </Link>
        <Link href="/about" className="text-sm text-muted hover:text-amber transition-colors">
          About
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <BirdNav compact />
        <Link href="/search" className="text-sm text-muted hover:text-amber transition-colors">
          Search
        </Link>
        <ThemeToggle className="text-sm text-muted hover:text-amber transition-colors" />
      </div>
    </header>
  );
}
