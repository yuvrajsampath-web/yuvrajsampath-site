"use client";

import { useState, type FormEvent } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="text-sm text-amber">Subscribed — thank you.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-amber"
        />
        {/* Honeypot — hidden from real visitors, left blank by them, filled by most bots */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-md bg-amber px-4 py-1.5 text-sm font-medium text-amber-ink disabled:opacity-60"
        >
          {status === "sending" ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-500">Couldn&apos;t subscribe — try again.</p>
      )}
    </form>
  );
}
