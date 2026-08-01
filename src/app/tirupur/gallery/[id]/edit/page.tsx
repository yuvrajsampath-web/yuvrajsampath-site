"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GalleryForm } from "@/components/portal/GalleryForm";
import { getGalleryPhotoById } from "@/lib/portal-data";
import type { GalleryPhoto } from "@/lib/types";

export default function EditGalleryPhotoPage() {
  const { id } = useParams<{ id: string }>();
  const [photo, setPhoto] = useState<GalleryPhoto | null | undefined>(undefined);

  useEffect(() => {
    getGalleryPhotoById(id).then(setPhoto);
  }, [id]);

  if (photo === undefined) return <p className="text-muted">Loading…</p>;
  if (photo === null) return <p className="text-muted">Not found.</p>;

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Edit photo</h1>
      <GalleryForm initial={photo} photoId={id} />
    </div>
  );
}
