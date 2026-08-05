import { escapeHtml } from "./utils.js";
import { highlightInlineCode } from "./highlight.js";

export function formatText(str) {
  if (str == null) return "";
  const text = String(str);
  const parts = [];
  let last = 0;
  const re = /`([^`]+)`/g;
  let match;

  while ((match = re.exec(text)) !== null) {
    parts.push(escapeHtml(text.slice(last, match.index)));
    parts.push(`<code class="inline-code">${highlightInlineCode(match[1])}</code>`);
    last = match.index + match[0].length;
  }

  parts.push(escapeHtml(text.slice(last)));
  return parts.join("");
}
