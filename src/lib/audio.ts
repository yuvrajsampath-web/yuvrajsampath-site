/**
 * Browsers/OSes often tag audio-only .mp4/.m4a files (common from WhatsApp
 * and voice recorder exports) as "video/mp4", which makes <audio> refuse to
 * play them. Force a real audio content type from the extension instead of
 * trusting file.type.
 */
export function audioContentType(fileName: string, fallbackType: string): string {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    mp3: "audio/mpeg",
    mp4: "audio/mp4",
    m4a: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    webm: "audio/webm",
    aac: "audio/aac",
    flac: "audio/flac",
    amr: "audio/amr",
  };
  if (byExt[ext]) return byExt[ext];
  if (fallbackType.startsWith("audio/")) return fallbackType;
  return "audio/mpeg";
}
