import { state } from "./state.js";
import { prepareJavaForPiston } from "./java.js";

const OFFLINE_NOTE = "\n\n(modo offline: resultado esperado)";

export function formatRunOutput(result) {
  if (!result) return "";
  if (result.error) return result.error;
  const parts = [];
  if (result.stdout) parts.push(result.stdout.trimEnd());
  if (result.stderr) parts.push(result.stderr.trimEnd());
  if (!parts.length) {
    if (result.compileError) return result.compileError;
    return "(sem saída)";
  }
  return parts.join("\n");
}

export function getFallbackOutput(template, methodIndex) {
  if (!template) return null;

  const methodTest =
    methodIndex != null && template.methodTests
      ? template.methodTests[methodIndex]
      : null;

  const text =
    (methodTest && methodTest.expectedOutput) ||
    template.expectedOutput ||
    null;

  if (!text) return null;
  return { ok: true, stdout: text, offline: true };
}

export function formatFallbackDisplay(fallback) {
  if (!fallback) return "Sem conexão. Conecte à internet para executar o código ao vivo.";
  return formatRunOutput(fallback) + OFFLINE_NOTE;
}

export async function initExecution(config) {
  if (!config || !config.enabled) {
    state.executionAvailable = false;
    return false;
  }

  if (!navigator.onLine) {
    state.executionAvailable = false;
    return false;
  }

  const healthPath = config.healthPath || "/health";

  try {
    const res = await fetch(healthPath, {
      method: "GET",
      signal: AbortSignal.timeout(3000)
    });
    state.executionAvailable = res.ok;
    return state.executionAvailable;
  } catch {
    state.executionAvailable = false;
    return false;
  }
}

export async function executeJavaSource(code, runEntry) {
  const config = state.pistonConfig;
  const prepared = prepareJavaForPiston(code, Object.assign({ code }, runEntry || {}));
  const executePath = config.executePath || "/execute";
  const baseUrl = config.url ? String(config.url).replace(/\/$/, "") : "";
  const endpoint = baseUrl ? `${baseUrl}${executePath}` : executePath;
  const timeout = Math.min(config.timeout || 3000, 3000);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: config.language || "java",
      version: config.version || "15.0.2",
      files: [{ name: prepared.file, content: prepared.content, encoding: "utf8" }],
      stdin: (runEntry && runEntry.stdin) || "",
      run_timeout: timeout
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = data.error || data.message || `Erro ${response.status} no proxy.`;
    throw new Error(msg);
  }

  if (data.error) {
    return { ok: false, compileError: data.error };
  }

  const compile = data.compile || {};
  const run = data.run || {};

  if (compile.code !== 0 && compile.code != null) {
    return {
      ok: false,
      compileError: (compile.stderr || compile.output || "Erro de compilação.").trim()
    };
  }

  if (run.code !== 0 && run.code != null && !run.stdout && !run.stderr) {
    return {
      ok: false,
      stderr: (run.stderr || run.output || `Programa encerrou com código ${run.code}.`).trim()
    };
  }

  return {
    ok: true,
    stdout: run.stdout || "",
    stderr: run.stderr || ""
  };
}

export async function executeOnPiston(runId) {
  const source = state.runSources.get(runId);
  if (!source) throw new Error("Código não encontrado para execução.");
  const code = (source.runEntry && source.runEntry.code) || source.displayCode;
  return executeJavaSource(code, source.runEntry);
}

export async function runWithFallback({ template, methodIndex, runFn }) {
  if (!state.executionAvailable) {
    const fallback = getFallbackOutput(template, methodIndex);
    return { result: fallback, usedFallback: true, offline: true };
  }

  try {
    const result = await runFn();
    return { result, usedFallback: false, offline: false };
  } catch {
    const fallback = getFallbackOutput(template, methodIndex);
    if (fallback) {
      return { result: fallback, usedFallback: true, offline: true };
    }
    throw new Error("Falha ao executar. Verifique a conexão.");
  }
}

export function applyOfflineUi() {
  document.body.classList.toggle("deck--offline", !state.executionAvailable);
  document.body.classList.toggle("deck--no-builtin-inputs", !state.builtinInputsEnabled);

  document.querySelectorAll(".code-run-btn, .builtin-run-btn").forEach((btn) => {
    if (!state.pistonConfig?.enabled) return;
    btn.disabled = !state.executionAvailable;
    btn.title = state.executionAvailable
      ? ""
      : "Sem conexão. O resultado esperado aparece ao clicar Executar.";
  });
}
