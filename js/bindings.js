import { state } from "./state.js";
import { applyRunTemplate } from "./templates.js";
import {
  executeJavaSource,
  executeOnPiston,
  formatRunOutput,
  formatFallbackDisplay,
  getFallbackOutput,
  runWithFallback
} from "./piston.js";
import { showTerminalOutput, hideTerminalOutput } from "./terminal.js";
import { clearBuiltinMethodSelection, readBuiltinInputValues } from "./builtin.js";

let runsBound = false;

async function handleCodeRun(button) {
  const runId = button.getAttribute("data-run-id");
  const label = button.querySelector("span");
  const btn = state.pistonConfig.button || {};
  const loadingLabel = btn.loadingLabel || "Executando...";
  const runLabel = btn.label || "Executar";
  if (!runId) return;

  const source = state.runSources.get(runId);
  const template = {
    expectedOutput:
      (source && source.expectedOutput) ||
      (source && source.runEntry && source.runEntry.expectedOutput)
  };

  button.disabled = true;
  if (label) label.textContent = loadingLabel;
  showTerminalOutput(runId, "Executando...", false);

  try {
    const { result, usedFallback } = await runWithFallback({
      template,
      methodIndex: null,
      runFn: () => executeOnPiston(runId)
    });

    const text = usedFallback
      ? formatFallbackDisplay(result)
      : formatRunOutput(result);

    showTerminalOutput(runId, text, !result.ok && !usedFallback);
  } catch (err) {
    showTerminalOutput(runId, err.message || "Falha ao executar o código.", true);
  } finally {
    button.disabled = false;
    if (label) label.textContent = runLabel;
  }
}

async function handleBuiltinRun(button) {
  const runId = button.getAttribute("data-run-id");
  const label = button.querySelector("span");
  const template = state.builtinTemplates.get(runId);
  const btn = state.pistonConfig.button || {};
  const loadingLabel = btn.loadingLabel || "Executando...";
  const runLabel = btn.label || "Executar";
  if (!runId || !template) return;

  clearBuiltinMethodSelection(runId);

  const fields = template.defaultFields || [];
  const values = readBuiltinInputValues(runId, fields);
  const prepared = applyRunTemplate(template.code, values, fields);

  button.disabled = true;
  if (label) label.textContent = loadingLabel;
  showTerminalOutput(runId, "Executando...", false);

  try {
    const { result, usedFallback } = await runWithFallback({
      template,
      methodIndex: null,
      runFn: () => executeJavaSource(prepared, { code: prepared })
    });

    const text = usedFallback
      ? formatFallbackDisplay(result)
      : formatRunOutput(result);

    showTerminalOutput(runId, text, !result.ok && !usedFallback);
  } catch (err) {
    const fallback = getFallbackOutput(template, null);
    showTerminalOutput(
      runId,
      fallback ? formatFallbackDisplay(fallback) : err.message || "Falha ao executar.",
      !fallback
    );
  } finally {
    button.disabled = false;
    if (label) label.textContent = runLabel;
  }
}

export function bindRunButtons() {
  if (!state.pistonConfig || !state.pistonConfig.enabled) return;
  if (runsBound) return;
  runsBound = true;

  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest(".terminal-output-close");
    if (closeBtn) {
      e.stopPropagation();
      hideTerminalOutput(closeBtn.getAttribute("data-run-id"));
      return;
    }

    const overlay = e.target.closest(".terminal-output-overlay");
    if (overlay && e.target === overlay) {
      hideTerminalOutput(overlay.getAttribute("data-run-id"));
      return;
    }

    const clearBtn = e.target.closest(".code-run-clear");
    if (clearBtn) {
      hideTerminalOutput(clearBtn.getAttribute("data-run-id"));
      return;
    }

    const codeBtn = e.target.closest(".code-run-btn");
    if (codeBtn && !codeBtn.disabled) {
      handleCodeRun(codeBtn);
      return;
    }

    const builtinBtn = e.target.closest(".builtin-run-btn");
    if (builtinBtn && !builtinBtn.disabled) {
      handleBuiltinRun(builtinBtn);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".terminal-output-overlay.is-open").forEach((el) => {
        hideTerminalOutput(el.getAttribute("data-run-id"));
      });
      return;
    }

    if (e.key !== "Enter" || !e.target.classList.contains("terminal-prompt-input")) return;
    const runId = e.target.getAttribute("data-run-id");
    const btn = document.querySelector(`.builtin-run-btn[data-run-id="${runId}"]`);
    if (btn && !btn.disabled) btn.click();
  });
}

export function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panelId = btn.getAttribute("data-tab");
      const shell = btn.closest("[data-tab-group]");
      if (!shell) return;
      shell.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      shell.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add("active");
    });
  });
}
