"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { PORTAL_PATH } from "@/lib/portal-config";

export function PortalHeader() {
  return (
    <header className="border-b border-line px-6 py-4 flex items-center justify-between">
      <Link href={`/${PORTAL_PATH}`} className="font-display text-lg">
        Portal
      </Link>
      <div className="flex items-center gap-5">
        <Link
          href={`/${PORTAL_PATH}/architecture`}
          className="text-sm text-muted hover:text-amber transition-colors"
        >
          Architecture
        </Link>
        <button
          onClick={() => signOut(auth)}
          className="text-sm text-muted hover:text-amber transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
