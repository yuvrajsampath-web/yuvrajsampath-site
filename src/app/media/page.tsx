import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getMedia } from "@/lib/data";
import { extractYouTubeId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "குயில் — Media",
  description: "Recorded podcasts and videos from Yuvraj Sampath.",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function embedUrl(url: string) {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export default async function MediaPage() {
  const entries = await getMedia();

  return (
    <div className="flex flex-col flex-1">
      <TopNav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">Media</p>
        <h1 className="mt-2 font-tamil-display text-4xl sm:text-5xl">குயில்</h1>
        <p className="mt-3 text-muted max-w-prose">
          the koel — the bird of the melodious call — podcasts and videos
        </p>

        <ol className="mt-10 space-y-10 border-t border-line pt-10">
          {entries.length === 0 && <li className="text-muted">Nothing published here yet.</li>}
          {entries.map((m) => {
            const embed = m.kind === "video" ? embedUrl(m.url) : null;
            return (
              <li key={m.id}>
                <p className="text-xs tracking-[0.15em] uppercase text-muted tabular-nums">
                  {formatDate(m.publishedAt)} · {m.kind === "podcast" ? "Podcast" : "Video"}
                </p>
                <h2 className="mt-1.5 font-display text-xl">{m.title}</h2>
                {m.description && <p className="mt-2 text-muted">{m.description}</p>}
                {embed ? (
                  <div className="mt-4 aspect-video w-full overflow-hidden rounded-md border border-line">
                    <iframe
                      src={embed}
                      title={m.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-amber hover:opacity-75 transition-opacity"
                  >
                    Listen / watch →
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
