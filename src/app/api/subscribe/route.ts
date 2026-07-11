import { randomBytes } from "node:crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const honeypot = typeof body?.company === "string" ? body.company : "";

  // Honeypot: a hidden field real visitors never fill in; bots often do.
  if (honeypot) {
    return Response.json({ ok: true });
  }

  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "That doesn't look like a valid email." }, { status: 400 });
  }

  const db = getAdminDb();
  const existing = await db.collection("subscribers").where("email", "==", email).limit(1).get();
  if (existing.empty) {
    const token = randomBytes(16).toString("hex");
    await db.collection("subscribers").add({
      email,
      token,
      subscribedAt: FieldValue.serverTimestamp(),
      unopenedStreak: 0,
      lastOpenedAt: null,
    });
  }

  return Response.json({ ok: true });
}
