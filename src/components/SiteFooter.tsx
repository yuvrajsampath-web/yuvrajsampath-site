import Link from "next/link";
import { SubscribeForm } from "./SubscribeForm";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line px-6 py-10 text-center text-sm text-muted">
      <p className="mb-3">Get new writing by email</p>
      <SubscribeForm />

      <nav className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Link href="/about" className="hover:text-amber transition-colors">
          About
        </Link>
        <Link href="/media" className="hover:text-amber transition-colors">
          Podcasts &amp; Videos
        </Link>
        <Link href="/daily" className="hover:text-amber transition-colors">
          Archive
        </Link>
        <a href="/rss.xml" className="hover:text-amber transition-colors">
          RSS
        </a>
        <Link href="/search" className="hover:text-amber transition-colors">
          Search
        </Link>
      </nav>
      <p className="mt-6 font-tamil-body">யுவராஜ் சம்பத் · Yuvraj Sampath</p>
    </footer>
  );
}
