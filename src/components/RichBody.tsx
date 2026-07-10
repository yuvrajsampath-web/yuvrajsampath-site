/**
 * Renders HTML authored via the portal's TipTap editor. There is no public
 * submission path into this content — only the authenticated author writes it —
 * so it does not need sanitizing against a third-party threat model.
 */
export function RichBody({ html }: { html: string }) {
  return (
    <div
      className="prose-body font-body text-lg leading-relaxed [&_p]:mb-5 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-amber [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted [&_em]:font-display [&_em]:italic"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
