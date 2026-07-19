import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getBooks } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "வானம்பாடி — Books",
  description: "Collected குறிஞ்சிட்டு by Yuvraj Sampath, bound into print-ready volumes.",
};

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <div className="flex flex-col flex-1">
      <TopNav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">Books</p>
        <h1 className="mt-2 font-tamil-display text-4xl sm:text-5xl">வானம்பாடி</h1>
        <p className="mt-3 text-muted max-w-prose">
          the skylark — its unbroken daily song, gathered here into bound volumes of குறிஞ்சிட்டு
        </p>

        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {books.length === 0 && <li className="text-muted">Nothing published here yet.</li>}
          {books.map((book) => (
            <li key={book.id} className="flex flex-col">
              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-md border border-line shadow-sm transition-transform hover:-translate-y-0.5"
                aria-label={`Open ${book.title} as PDF`}
              >
                <div
                  className="flex aspect-[7/5] w-full flex-col items-center justify-center gap-2 px-4 text-center"
                  style={{
                    background: "linear-gradient(160deg, #f4c88b 0%, #db7a3c 55%, #2a1410 100%)",
                  }}
                >
                  <p className="font-tamil-display text-base text-[#fff8ee] max-w-full">
                    {book.tamilTitle}
                  </p>
                  <p className="text-[0.65rem] tracking-[0.2em] text-[#fff8ee]/85">{book.title}</p>
                  <div className="h-px w-10 bg-[#fff8ee]/60" />
                  <p className="text-[0.65rem] text-[#fff8ee]/75">{book.haikuCount} குறிஞ்சிட்டு</p>
                </div>
              </a>
              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-amber hover:opacity-75 transition-opacity"
              >
                View / download PDF →
              </a>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
