const YOUTUBE_ID_RE = /(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/;

export function extractYouTubeId(url: string): string | null {
  return url.match(YOUTUBE_ID_RE)?.[1] ?? null;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
