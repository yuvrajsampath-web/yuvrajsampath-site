import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line px-6 py-10 text-center text-sm text-muted">
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Link href="/media" className="hover:text-amber transition-colors">
          Podcasts &amp; Videos
        </Link>
        <Link href="/daily" className="hover:text-amber transition-colors">
          Archive
        </Link>
      </nav>
      <p className="mt-6 font-tamil-body">யுவராஜ் சம்பத் · Yuvraj Sampath</p>
    </footer>
  );
}
