"use client";

import { useSearchParams } from "next/navigation";
import { WritingForm } from "@/components/portal/WritingForm";
import { isCategorySlug } from "@/lib/categories";

export default function NewWritingPage() {
  const params = useSearchParams();
  const categoryParam = params.get("category");
  const defaultCategory = categoryParam && isCategorySlug(categoryParam) ? categoryParam : undefined;

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">New entry</h1>
      <WritingForm defaultCategory={defaultCategory} />
    </div>
  );
}
