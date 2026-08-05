import { state } from "./state.js";
import { escapeHtml, guessFilename } from "./utils.js";
import { highlightJava } from "./highlight.js";
import { icon } from "./icon.js";
import { renderTerminalOutputOverlay } from "./builtin.js";
import { formatStaticOutputHtml } from "./terminal.js";

export function renderCodeWindowWithOutput(code, output, opts) {
  const options = opts || {};
  const name = guessFilename(code, options.filename);
  const outputHtml = formatStaticOutputHtml(String(output || "").trimEnd());

  return `
    <div class="code-window code-window--static-output">
      <div class="code-window-bar">
        <span class="code-window-dot code-window-dot-red"></span>
        <span class="code-window-dot code-window-dot-yellow"></span>
        <span class="code-window-dot code-window-dot-green"></span>
        <span class="code-window-title">${escapeHtml(name)}</span>
      </div>
      <pre class="code-block code-window-body code-window-body--compact">${highlightJava(code)}</pre>
      <div class="code-window-output">
        <div class="code-window-output-head">
          <span class="terminal-prompt-char">$</span>
          <span>saída</span>
        </div>
        <pre class="code-window-output-body terminal-output-body--formatted">${outputHtml}</pre>
      </div>
    </div>`;
}

export function codeOpts(slide, extra) {
  const opts = extra || {};
  const base = { filename: opts.filename || slide.filename };
  const run = Object.assign({}, slide.run || {}, opts.run || {});
  const hasInputs = Array.isArray(run.inputs) && run.inputs.length > 0;
  const staticOutput =
    opts.staticOutput ?? slide.output ?? run.output ?? run.expectedOutput ?? null;

  if (staticOutput != null && staticOutput !== "" && !hasInputs) {
    return Object.assign(base, { staticOutput });
  }

  if (!state.pistonConfig || !state.pistonConfig.enabled) return base;
  if (!run.enabled) return base;

  const runId = opts.runId || `slide-${slide.id}`;
  return Object.assign(base, {
    runnable: true,
    runId,
    runEntry: {
      code: run.code,
      stdin: run.stdin || "",
      entryFile: run.entryFile || opts.filename || slide.filename,
      expectedOutput: run.expectedOutput || null
    }
  });
}

export function renderCodeWindow(code, opts) {
  const options = opts || {};
  if (options.staticOutput != null && options.staticOutput !== "") {
    return renderCodeWindowWithOutput(code, options.staticOutput, options);
  }

  const name = guessFilename(code, options.filename);
  const btn = state.pistonConfig && state.pistonConfig.button ? state.pistonConfig.button : {};
  const runLabel = btn.label || "Executar";
  const clearLabel = btn.clearLabel || "Limpar";
  const runIcon = btn.icon || "play";
  const clearIcon = btn.clearIcon || "eraser";

  if (options.runnable && options.runId) {
    const expectedOutput =
      (options.runEntry && options.runEntry.expectedOutput) || null;
    state.runSources.set(options.runId, {
      displayCode: code,
      runEntry: options.runEntry || {},
      expectedOutput
    });
  }

  const footer = options.runnable
    ? `
        <div class="code-window-footer">
          <button type="button" class="code-run-btn" data-run-id="${escapeHtml(options.runId)}">
            ${icon(runIcon, 22)}
            <span>${escapeHtml(runLabel)}</span>
          </button>
          <button type="button" class="code-run-clear" data-run-id="${escapeHtml(options.runId)}">
            ${icon(clearIcon, 22)}
            <span>${escapeHtml(clearLabel)}</span>
          </button>
        </div>
        ${renderTerminalOutputOverlay(options.runId)}`
    : "";

  return `
    <div class="code-window code-window--run-host${options.runnable ? " code-window--runnable" : ""}" data-run-id="${escapeHtml(options.runId || "")}">
      <div class="code-window-bar">
        <span class="code-window-dot code-window-dot-red"></span>
        <span class="code-window-dot code-window-dot-yellow"></span>
        <span class="code-window-dot code-window-dot-green"></span>
        <span class="code-window-title">${escapeHtml(name)}</span>
      </div>
      <pre class="code-block code-window-body">${highlightJava(code)}</pre>
      ${footer}
    </div>`;
}

export function renderCodeBlock(code, opts) {
  if (!code) return "";
  if (opts && opts.plain) {
    return `<pre class="code-block">${highlightJava(code)}</pre>`;
  }
  return renderCodeWindow(code, opts || {});
}
