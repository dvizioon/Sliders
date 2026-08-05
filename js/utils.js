export function activeSlides(slides) {
  return slides.filter((s) => s.active !== false);
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escapeJavaString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function displayBuiltinCode(code) {
  if (!code) return "";
  return String(code)
    .replace(/^(import\s+[\w.*]+\s*;\s*\n?)+/m, "")
    .trim();
}

export function guessFilename(code, explicit) {
  if (explicit) return explicit;
  const match = String(code).match(/\bclass\s+(\w+)/);
  return match ? `${match[1]}.java` : "Main.java";
}

export function indentLines(text, spaces) {
  const pad = " ".repeat(spaces);
  return String(text)
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}
