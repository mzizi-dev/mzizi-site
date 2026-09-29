/**
 * Markdown to HTML, for registry content rendered at build time.
 *
 * The skill bodies are MDX in the registry, but plain Markdown in practice:
 * no component imports outside code fences. They are also REMOTE INPUT: this
 * site writes whatever the API serves into its HTML. So raw HTML in a body is
 * escaped rather than passed through, and a link or image is kept only when
 * its URL is http(s), mailto, or relative. Anything else becomes plain text.
 */
import { Marked, type Tokens } from "marked";

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function safeUrl(href: string): string | null {
  const trimmed = href.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  // Relative, root-relative, or a fragment — but never a scheme of any kind.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return null;
}

const marked = new Marked({
  gfm: true,
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(token.text);
    },
    link(token: Tokens.Link) {
      const text = this.parser.parseInline(token.tokens);
      const href = safeUrl(token.href);
      if (!href) return text;
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<a href="${escapeHtml(href)}"${title}>${text}</a>`;
    },
    image(token: Tokens.Image) {
      const href = safeUrl(token.href);
      if (!href) return escapeHtml(token.text);
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(token.text)}" loading="lazy" />`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false });
}
