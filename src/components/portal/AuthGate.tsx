"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { AUTHOR_EMAIL } from "@/lib/portal-config";
import { LoginForm } from "./LoginForm";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-display text-xl">Firebase isn&apos;t connected yet</p>
        <p className="text-muted max-w-sm">
          Set the <code className="text-sm">NEXT_PUBLIC_FIREBASE_*</code> variables in{" "}
          <code className="text-sm">.env.local</code> (see README) to enable sign-in.
        </p>
      </div>
    );
  }

  if (user === undefined) {
    return <div className="flex flex-1 items-center justify-center text-muted">Loading…</div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  if (AUTHOR_EMAIL && user.email !== AUTHOR_EMAIL) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p>
          Signed in as <strong>{user.email}</strong>, which isn&apos;t the author account.
        </p>
        <button
          onClick={() => signOut(auth)}
          className="rounded-md border border-line px-4 py-2 hover:border-amber hover:text-amber transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
