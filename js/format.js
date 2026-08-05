import { escapeHtml } from "./utils.js";
import { highlightInlineCode } from "./highlight.js";

const INLINE_TOKEN =
  /(`[^`]+`|\*\*[^*]+?\*\*|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;

function formatPlain(text) {
  return escapeHtml(text);
}

export function formatText(str) {
  if (str == null) return "";
  const text = String(str);
  const parts = [];
  let last = 0;
  let match;

  while ((match = INLINE_TOKEN.exec(text)) !== null) {
    parts.push(formatPlain(text.slice(last, match.index)));
    const token = match[0];

    if (token.startsWith("`")) {
      const code = token.slice(1, -1);
      parts.push(`<code class="inline-code">${highlightInlineCode(code)}</code>`);
    } else if (token.startsWith("**")) {
      parts.push(`<strong>${formatPlain(token.slice(2, -2))}</strong>`);
    } else if (token.startsWith("[")) {
      const labelEnd = token.indexOf("](");
      const label = token.slice(1, labelEnd);
      const url = match[1];
      parts.push(
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${formatPlain(label)}</a>`
      );
    }

    last = match.index + token.length;
  }

  parts.push(formatPlain(text.slice(last)));
  return parts.join("");
}
