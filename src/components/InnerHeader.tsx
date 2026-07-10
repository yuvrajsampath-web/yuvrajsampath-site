import Link from "next/link";
import { BirdNav } from "./BirdNav";

export function InnerHeader() {
  return (
    <header className="border-b border-line px-6 py-5 flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="font-tamil-body text-lg font-medium shrink-0">
        யுவராஜ் சம்பத்
      </Link>
      <BirdNav compact />
    </header>
  );
}
