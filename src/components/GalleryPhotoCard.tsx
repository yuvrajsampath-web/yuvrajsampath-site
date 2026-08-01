"use client";

import { useState } from "react";
import type { GalleryPhoto } from "@/lib/types";

export function GalleryPhotoCard({ photo, formattedDate }: { photo: GalleryPhoto; formattedDate: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="overflow-hidden rounded-md border border-line shadow-sm cursor-zoom-in"
        aria-label={`View ${photo.caption} full size`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.imageUrl} alt={photo.caption} className="block w-full h-auto" />
      </button>
      <p className="mt-3">{photo.caption}</p>
      <p className="text-xs tracking-[0.15em] uppercase text-muted tabular-nums">{formattedDate}</p>

      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Close full size photo"
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl}
            alt={photo.caption}
            className="max-h-full max-w-full object-contain"
          />
        </button>
      )}
    </li>
  );
}
