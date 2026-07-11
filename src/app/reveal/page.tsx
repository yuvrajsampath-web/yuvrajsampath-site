"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FADE_MS = 700;

export default function RevealPage() {
  const [hint, setHint] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHint(true), 2200);
    return () => clearTimeout(t);
  }, []);

  function handleContinue() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      window.location.href = "/";
    }, FADE_MS);
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 transition-opacity ease-out"
      style={{
        backgroundColor: "#050403",
        opacity: leaving ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      <button
        type="button"
        onClick={handleContinue}
        aria-label="Continue to yuvrajsampath.com"
        className="group relative w-full max-w-md cursor-pointer"
      >
        <span
          className="absolute inset-0 -z-10 scale-95 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-60"
          style={{ background: "radial-gradient(circle, #caa14a 0%, transparent 70%)" }}
          aria-hidden
        />
        <Image
          src="/machan.png"
          alt="என் ஆசை மச்சான்"
          width={1536}
          height={1024}
          priority
          className="h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      </button>

      <p
        className="mt-8 text-xs tracking-[0.2em] uppercase text-white/40 transition-opacity duration-700"
        style={{ opacity: hint ? 1 : 0 }}
      >
        Tap to continue
      </p>
    </div>
  );
}
