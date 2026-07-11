import type { Metadata } from "next";
import { AuthGate } from "@/components/portal/AuthGate";
import { PortalHeader } from "@/components/portal/PortalHeader";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 bg-paper">
      <AuthGate>
        <PortalHeader />
        <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10">{children}</main>
      </AuthGate>
    </div>
  );
}
