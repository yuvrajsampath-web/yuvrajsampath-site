import { Webhook } from "svix";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RESEND_WEBHOOK_SECRET is not set");
    return new Response("Not configured", { status: 500 });
  }

  // Signature verification needs the exact raw bytes Resend signed — reading
  // via request.json() first (which re-serializes) would break it.
  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: { type: string; data: { tags?: Record<string, string> } };
  try {
    event = new Webhook(secret).verify(payload, headers) as typeof event;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "email.opened") {
    const subscriberId = event.data.tags?.subscriber_id;
    if (subscriberId) {
      const db = getAdminDb();
      const ref = db.collection("subscribers").doc(subscriberId);
      const doc = await ref.get();
      if (doc.exists) {
        await ref.update({ unopenedStreak: 0, lastOpenedAt: FieldValue.serverTimestamp() });
      }
    }
  }

  return Response.json({ ok: true });
}
