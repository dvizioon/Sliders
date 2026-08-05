import { escapeHtml } from "./utils.js";

function formatOutputValue(value) {
  if (value === "") {
    return '<span class="term-out-val term-out-val--empty">(vazio)</span>';
  }

  if (/^\s+$/.test(value)) {
    return `<span class="term-out-val term-out-val--space">"${escapeHtml(value)}"</span>`;
  }

  const escaped = escapeHtml(value);
  const inner = escaped
    .replace(/\[/g, '<span class="term-out-bracket">[</span>')
    .replace(/\]/g, '<span class="term-out-bracket">]</span>');
  return `<span class="term-out-val">${inner}</span>`;
}

function formatOutputLine(line) {
  const trimmed = String(line).trimEnd();
  const idx = trimmed.indexOf(":");

  if (idx <= 0) {
    return escapeHtml(trimmed);
  }

  const key = trimmed.slice(0, idx);
  const value = trimmed.slice(idx + 1).trimStart();

  return `<span class="term-out-key">${escapeHtml(key)}:</span> ${formatOutputValue(value)}`;
}

function shouldFormatPlain(text, isError) {
  if (isError) return true;
  if (!text || text === "Executando...") return true;
  if (text.includes("modo offline")) return true;
  return false;
}

function renderOutputHtml(text, isError) {
  if (shouldFormatPlain(text, isError)) {
    return null;
  }

  return text.split("\n").map(formatOutputLine).join("\n");
}

export function formatStaticOutputHtml(text) {
  if (!text) return "";
  return text.split("\n").map(formatOutputLine).join("\n");
}

export function showTerminalOutput(runId, text, isError) {
  const overlay = document.querySelector(`.terminal-output-overlay[data-run-id="${runId}"]`);
  const output = document.querySelector(`.run-output[data-run-id="${runId}"]`);
  if (!overlay || !output) return;

  const formatted = renderOutputHtml(text, isError);

  if (formatted == null) {
    output.textContent = text;
  } else {
    output.innerHTML = formatted;
  }

  output.classList.toggle("terminal-output-body--error", !!isError);
  output.classList.toggle("terminal-output-body--offline", text.includes("modo offline"));
  output.classList.toggle("terminal-output-body--formatted", formatted != null);
  overlay.classList.remove("is-closing");
  overlay.classList.add("is-open");
  overlay.closest(".mini-terminal")?.classList.add("mini-terminal--result-open");
}

export function hideTerminalOutput(runId) {
  const overlay = document.querySelector(`.terminal-output-overlay[data-run-id="${runId}"]`);
  if (!overlay || !overlay.classList.contains("is-open")) return;
  overlay.classList.add("is-closing");
  overlay.classList.remove("is-open");
  overlay.closest(".mini-terminal")?.classList.remove("mini-terminal--result-open");
  window.setTimeout(() => overlay.classList.remove("is-closing"), 320);
}
