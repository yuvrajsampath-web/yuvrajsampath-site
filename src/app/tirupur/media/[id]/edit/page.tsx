"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MediaForm } from "@/components/portal/MediaForm";
import { getMediaById } from "@/lib/portal-data";
import type { MediaEntry } from "@/lib/types";

export default function EditMediaPage() {
  const { id } = useParams<{ id: string }>();
  const [media, setMedia] = useState<MediaEntry | null | undefined>(undefined);

  useEffect(() => {
    getMediaById(id).then(setMedia);
  }, [id]);

  if (media === undefined) return <p className="text-muted">Loading…</p>;
  if (media === null) return <p className="text-muted">Not found.</p>;

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Edit podcast / video</h1>
      <MediaForm initial={media} mediaId={id} />
    </div>
  );
}
