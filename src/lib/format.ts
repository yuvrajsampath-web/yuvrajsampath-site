export function formatDate(iso: string, style: "short" | "long" = "short") {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: style,
    year: "numeric",
  });
}
