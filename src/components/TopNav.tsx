"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { LogoMark } from "./LogoMark";
import { SubscribeForm } from "./SubscribeForm";
import { ThemeToggle } from "./ThemeToggle";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function NavLink({ href, tamil, english }: { href: string; tamil: string; english: string }) {
  return (
    <Link href={href} className="group flex shrink-0 flex-col items-center leading-tight">
      <span className="font-tamil-body text-sm transition-colors group-hover:text-amber">
        {tamil}
      </span>
      <span className="text-[0.6rem] tracking-[0.12em] uppercase text-muted transition-colors group-hover:text-amber/80">
        {english}
      </span>
    </Link>
  );
}

export function TopNav() {
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <LogoMark size={32} />
          <span className="font-display text-base">Yuvraj Sampath</span>
        </Link>

        <nav
          aria-label="Sections"
          className="flex flex-1 gap-5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((c) => (
            <NavLink key={c.slug} href={`/${c.slug}`} tamil={c.tamil} english={c.english} />
          ))}
          <NavLink href="/media" tamil="குயில்" english="Media" />
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <Link href="/about" className="text-sm text-muted transition-colors hover:text-amber">
            About
          </Link>
          <Link
            href="/search"
            aria-label="Search"
            className="text-muted transition-colors hover:text-amber"
          >
            <SearchIcon />
          </Link>
          <ThemeToggle />

          <div className="relative">
            <button
              type="button"
              onClick={() => setSubscribeOpen((v) => !v)}
              className="rounded-full bg-amber px-4 py-1.5 text-sm font-medium text-amber-ink transition-opacity hover:opacity-90"
            >
              Subscribe
            </button>
            {subscribeOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-md border border-line bg-surface p-4 shadow-lg">
                <p className="mb-2 text-sm text-muted">Get new writing by email</p>
                <SubscribeForm />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
