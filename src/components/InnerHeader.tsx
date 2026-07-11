import Link from "next/link";
import Image from "next/image";
import { BirdNav } from "./BirdNav";
import { ThemeToggle } from "./ThemeToggle";

export function InnerHeader() {
  return (
    <header className="border-b border-line px-6 py-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
            <Image src="/logo.png" alt="Yuvraj Sampath" width={28} height={28} className="h-full w-full object-cover" />
          </span>
          <span className="font-tamil-body text-lg font-medium">யுவராஜ் சம்பத்</span>
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
