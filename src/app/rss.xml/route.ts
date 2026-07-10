import { CATEGORY_BY_SLUG } from "@/lib/categories";
import { getRecentWritings } from "@/lib/data";

const SITE_URL = "https://yuvrajsampath.com";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const writings = await getRecentWritings(50);

  const items = writings
    .map((w) => {
      const def = CATEGORY_BY_SLUG[w.category];
      const plain = def.format === "rich" ? stripHtml(w.body) : w.body;
      const title = def.hasTitle && w.title ? w.title : plain.slice(0, 60);
      const url = `${SITE_URL}/${w.category}/${w.id}`;
      const pubDate = new Date(w.publishedAt + "T00:00:00Z").toUTCString();
      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <category>${escapeXml(def.english)}</category>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(plain.slice(0, 500))}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Yuvraj Sampath</title>
    <link>${SITE_URL}</link>
    <description>Daily writing, stories, poetry and essays from Yuvraj Sampath — in Tamil and English.</description>
    <language>ta</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
