"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { SubscribeForm } from "./SubscribeForm";
import { ThemeToggle } from "./ThemeToggle";

export function TopNav() {
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-tamil-body text-sm text-paper">
            ய
          </span>
          <span className="font-display text-base">Yuvraj Sampath</span>
        </Link>

        <nav
          aria-label="Sections"
          className="flex flex-1 gap-5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              title={c.english}
              className="shrink-0 font-tamil-body text-sm text-muted transition-colors hover:text-amber"
            >
              {c.tamil}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/about"
            className="hidden text-sm text-muted transition-colors hover:text-amber sm:inline"
          >
            About
          </Link>
          <ThemeToggle className="hidden text-sm text-muted transition-colors hover:text-amber sm:inline" />

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
