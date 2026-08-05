import { state } from "./state.js";
import { escapeHtml } from "./utils.js";
import { icon } from "./icon.js";
import { highlightJava } from "./highlight.js";
import { formatStaticOutputHtml } from "./terminal.js";

export function buildBuiltinInputs(slide) {
  return [...((slide.run && slide.run.inputs) || [])];
}

export function clearBuiltinMethodSelection(runId) {
  const playground = document.querySelector(`.builtin-playground[data-run-id="${runId}"]`);
  if (!playground) return;
  playground.removeAttribute("data-active-method");
  const slideShell = playground.closest(".slide-shell");
  if (!slideShell) return;
  slideShell.querySelectorAll(".builtin-method-item--active").forEach((item) => {
    item.classList.remove("builtin-method-item--active");
  });
}

export function getMethodFields(template, methodIndex) {
  if (!template) return [];
  if (methodIndex == null || methodIndex < 0) {
    return template.defaultFields || [];
  }

  const methodTest = template.methodTests && template.methodTests[methodIndex];
  if (!methodTest) return template.defaultFields || [];

  if (methodTest.fields && methodTest.fields.length) {
    return methodTest.fields;
  }

  if (methodTest.values) {
    return Object.keys(methodTest.values).map((varName) => {
      const meta = (template.inputs || []).find((i) => i.var === varName);
      if (meta) return { var: meta.var, label: meta.label || meta.var, type: meta.type };
      const val = methodTest.values[varName];
      const isNum = /^-?\d+(\.\d+)?$/.test(String(val));
      return { var: varName, label: varName, type: isNum ? "number" : "text" };
    });
  }

  return [];
}

export function readBuiltinInputValues(runId, fields) {
  const values = {};
  if (!fields?.length) return values;

  const playground = document.querySelector(`.builtin-playground[data-run-id="${runId}"]`);

  fields.forEach((inp) => {
    if (!state.builtinInputsEnabled) {
      values[inp.var] = inp.default != null ? inp.default : "";
      return;
    }

    const el = playground?.querySelector(`.builtin-input[data-var="${inp.var}"]`);
    values[inp.var] = el ? el.value : inp.default || "";
  });
  return values;
}

function renderBuiltinHiddenInputs(runId, inputs) {
  if (!inputs?.length) return "";
  return inputs
    .map(
      (inp) => `
        <input
          type="hidden"
          class="builtin-input"
          data-run-id="${escapeHtml(runId)}"
          data-var="${escapeHtml(inp.var)}"
          value="${escapeHtml(inp.default || "")}"
        />`
    )
    .join("");
}

function renderTerminalPromptLine(runId, inp, value) {
  const val = value != null ? value : inp.default || "";
  return `
    <label class="terminal-prompt-line">
      <span class="terminal-prompt-label">${escapeHtml(inp.label || inp.var)}</span>
      <span class="terminal-prompt-char">$</span>
      <input
        type="text"
        class="terminal-prompt-input builtin-input"
        data-run-id="${escapeHtml(runId)}"
        data-var="${escapeHtml(inp.var)}"
        value="${escapeHtml(val)}"
        spellcheck="false"
      />
    </label>`;
}

export function renderTerminalFieldsRoot(runId, fields, valueMap) {
  const values = valueMap || {};
  if (!fields.length) {
    return `
      <div class="terminal-fields-root">
        <p class="terminal-no-inputs">Sem entrada. Clique Executar.</p>
      </div>`;
  }
  const lines = fields.map((inp) => renderTerminalPromptLine(runId, inp, values[inp.var])).join("");
  return `<div class="terminal-fields-root"><div class="terminal-prompts">${lines}</div></div>`;
}

export function updateBuiltinTerminalFields(runId, methodIndex) {
  const template = state.builtinTemplates.get(runId);
  const playground = document.querySelector(`.builtin-playground[data-run-id="${runId}"]`);
  if (!template || !playground) return;

  const fields = getMethodFields(template, methodIndex);
  const methodTest =
    methodIndex != null && template.methodTests ? template.methodTests[methodIndex] : null;
  const root = playground.querySelector(".terminal-fields-root");
  if (!root) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderTerminalFieldsRoot(runId, fields, methodTest && methodTest.values);
  const next = wrapper.firstElementChild;
  if (next) root.replaceWith(next);
}

export function renderBuiltinStaticOutput(output) {
  const outputHtml = formatStaticOutputHtml(String(output || "").trimEnd());
  return `
    <div class="mini-terminal-divider"></div>
    <div class="mini-terminal-output">
      <div class="code-window-output-head">
        <span class="terminal-prompt-char">$</span>
        <span>saída</span>
      </div>
      <pre class="code-window-output-body terminal-output-body--formatted mini-terminal-output-body">${outputHtml}</pre>
    </div>`;
}

export function renderBuiltinRunPanel(runId) {
  const btn = (state.pistonConfig && state.pistonConfig.button) || {};
  return `
    <div class="builtin-run">
      <button type="button" class="builtin-run-btn" data-run-id="${escapeHtml(runId)}">
        ${icon(btn.icon || "play", 22)}
        <span>${escapeHtml(btn.label || "Executar")}</span>
      </button>
    </div>`;
}

export function renderTerminalOutputOverlay(runId) {
  return `
    <div class="terminal-output-overlay" data-run-id="${escapeHtml(runId)}">
      <div class="terminal-output-panel">
        <div class="terminal-output-bar">
          <span class="terminal-prompt-char">$</span>
          <span class="terminal-output-label">resultado</span>
          <button type="button" class="terminal-output-close" data-run-id="${escapeHtml(runId)}" aria-label="Fechar">
            ${icon("x", 14)}
          </button>
        </div>
        <pre class="terminal-output-body run-output" data-run-id="${escapeHtml(runId)}"></pre>
      </div>
    </div>`;
}

export function renderBuiltinTerminalCard({ code, fileName, run, runId, canRun, staticOutput }) {
  const title = fileName || "Main.java";
  const output = staticOutput ?? (run && run.expectedOutput);
  const useStatic = output != null && output !== "";

  const liveSection = useStatic
    ? renderBuiltinStaticOutput(output)
    : canRun
      ? `
        <div class="mini-terminal-divider"></div>
        <div class="mini-terminal-live${state.builtinInputsEnabled ? "" : " mini-terminal-live--output-only"}">
          ${state.builtinInputsEnabled ? `<p class="mini-terminal-live-label">Teste ao vivo</p>` : ""}
          ${
            state.builtinInputsEnabled
              ? renderTerminalFieldsRoot(runId, (run && run.inputs) || [])
              : renderBuiltinHiddenInputs(runId, (run && run.inputs) || [])
          }
          ${renderBuiltinRunPanel(runId)}
        </div>`
      : "";

  return `
    <div class="mini-terminal mini-terminal--full${useStatic ? " mini-terminal--static" : ""}">
      <div class="mini-terminal-bar">
        <span class="code-window-dot code-window-dot-red"></span>
        <span class="code-window-dot code-window-dot-yellow"></span>
        <span class="code-window-dot code-window-dot-green"></span>
        <span class="mini-terminal-title">${escapeHtml(title)}</span>
      </div>
      <div class="mini-terminal-stack">
        <pre class="mini-terminal-body mini-terminal-code code-block${useStatic ? " mini-terminal-code--compact" : ""}">${highlightJava(code)}</pre>
        ${liveSection}
      </div>
      ${!useStatic && canRun ? renderTerminalOutputOverlay(runId) : ""}
    </div>`;
}

export function renderBuiltinFields(run, runId, terminalStyle, allInputs) {
  const inputs = allInputs || (run && run.inputs) || [];
  if (!inputs.length) return "";

  const renderInput = (inp) => {
    if (inp.hidden) {
      return `
        <input
          type="hidden"
          class="builtin-input"
          data-run-id="${escapeHtml(runId)}"
          data-var="${escapeHtml(inp.var)}"
          value="${escapeHtml(inp.default || "")}"
        />`;
    }
    if (terminalStyle) {
      return renderTerminalPromptLine(runId, inp, inp.default);
    }
    return `
      <label class="builtin-field">
        <span>${escapeHtml(inp.label || inp.var)}</span>
        <input type="text" class="builtin-input" data-run-id="${escapeHtml(runId)}" data-var="${escapeHtml(inp.var)}" value="${escapeHtml(inp.default || "")}" />
      </label>`;
  };

  const visible = inputs.filter((inp) => !inp.hidden);
  const hidden = inputs.filter((inp) => inp.hidden);

  if (terminalStyle) {
    return `${hidden.map(renderInput).join("")}<div class="terminal-prompts">${visible.map(renderInput).join("")}</div>`;
  }

  return `<div class="builtin-run-fields">${inputs.map(renderInput).join("")}</div>`;
}

export function selectBuiltinMethod(runId, methodIndex) {
  const template = state.builtinTemplates.get(runId);
  const playground = document.querySelector(`.builtin-playground[data-run-id="${runId}"]`);
  if (!template || !playground) return null;

  updateBuiltinTerminalFields(runId, methodIndex);
  playground.setAttribute("data-active-method", String(methodIndex));

  const slideShell = playground.closest(".slide-shell");
  if (slideShell) {
    slideShell.querySelectorAll(".builtin-method-item").forEach((item, idx) => {
      item.classList.toggle("builtin-method-item--active", idx === methodIndex);
    });
    slideShell.querySelectorAll(".builtin-method-test-btn").forEach((btn) => {
      const idx = parseInt(btn.getAttribute("data-method-index"), 10);
      btn.classList.toggle("is-active", idx === methodIndex);
    });
  }

  return methodIndex;
}

export function getActiveMethodIndex(runId) {
  const playground = document.querySelector(`.builtin-playground[data-run-id="${runId}"]`);
  if (!playground) return null;
  const raw = playground.getAttribute("data-active-method");
  if (raw == null || raw === "") return null;
  const index = parseInt(raw, 10);
  return Number.isNaN(index) ? null : index;
}

export function registerBuiltinTemplate(runId, slide, allInputs) {
  state.builtinTemplates.set(runId, {
    code: slide.run.code,
    inputs: allInputs,
    defaultFields: slide.run.inputs || [],
    expectedOutput: slide.run.expectedOutput || null,
    methodTests: (slide.methods || []).map((m) => m.test || null)
  });
}
