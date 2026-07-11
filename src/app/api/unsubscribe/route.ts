import { getAdminDb } from "@/lib/firebase/admin";

function page(message: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe</title>
<style>body{font-family:system-ui,sans-serif;background:#f6f3ec;color:#201811;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:2rem}</style>
</head><body><p>${message}</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const token = url.searchParams.get("token") ?? "";

  if (!email || !token) {
    return page("Missing unsubscribe link parameters.");
  }

  const db = getAdminDb();
  const snap = await db
    .collection("subscribers")
    .where("email", "==", email)
    .where("token", "==", token)
    .limit(1)
    .get();

  if (snap.empty) {
    return page("That unsubscribe link is invalid or already used.");
  }

  await snap.docs[0].ref.delete();
  return page(`${email} has been unsubscribed.`);
}
