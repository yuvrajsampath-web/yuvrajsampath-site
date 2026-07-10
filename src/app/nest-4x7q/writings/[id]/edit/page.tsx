"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WritingForm } from "@/components/portal/WritingForm";
import { getWritingById } from "@/lib/portal-data";
import type { Writing } from "@/lib/types";

export default function EditWritingPage() {
  const { id } = useParams<{ id: string }>();
  const [writing, setWriting] = useState<Writing | null | undefined>(undefined);

  useEffect(() => {
    getWritingById(id).then(setWriting);
  }, [id]);

  if (writing === undefined) return <p className="text-muted">Loading…</p>;
  if (writing === null) return <p className="text-muted">Not found.</p>;

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Edit entry</h1>
      <WritingForm initial={writing} writingId={id} />
    </div>
  );
}
