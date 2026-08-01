import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getGalleryPhotos } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "தேன் குருவி — Gallery",
  description: "Memorable photographs from Yuvraj Sampath's life.",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function GalleryPage() {
  const photos = await getGalleryPhotos();

  return (
    <div className="flex flex-col flex-1">
      <TopNav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">Gallery</p>
        <h1 className="mt-2 font-tamil-display text-4xl sm:text-5xl">தேன் குருவி</h1>
        <p className="mt-3 text-muted max-w-prose">
          the sunbird — flitting from flower to flower, gathering the sweetest moments of a life
        </p>

        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {photos.length === 0 && <li className="text-muted">Nothing published here yet.</li>}
          {photos.map((photo) => (
            <li key={photo.id} className="flex flex-col">
              <div className="overflow-hidden rounded-md border border-line shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.imageUrl} alt={photo.caption} className="block w-full h-auto" />
              </div>
              <p className="mt-3">{photo.caption}</p>
              <p className="text-xs tracking-[0.15em] uppercase text-muted tabular-nums">
                {formatDate(photo.publishedAt)}
              </p>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
