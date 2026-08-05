import { escapeJavaString } from "./utils.js";

export function applyRunTemplate(template, values, inputs) {
  const meta = {};
  (inputs || []).forEach((inp) => {
    meta[inp.var] = inp;
  });

  const vars = new Set();
  (inputs || []).forEach((inp) => vars.add(inp.var));
  const placeholderRe = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = placeholderRe.exec(String(template))) !== null) {
    vars.add(match[1]);
  }

  let out = String(template);
  vars.forEach((key) => {
    const inp = meta[key];
    const raw =
      values[key] != null && values[key] !== ""
        ? values[key]
        : inp && inp.default != null
          ? inp.default
          : "";
    const replacement =
      inp && inp.type === "number"
        ? String(raw).replace(/[^0-9.-]/g, "") || "0"
        : `"${escapeJavaString(raw)}"`;
    out = out.split(`{{${key}}}`).join(replacement);
  });
  return out;
}
