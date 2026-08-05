import { escapeHtml } from "./utils.js";

export function highlightInlineCode(code) {
  let out = escapeHtml(code);
  out = out.replace(
    /\b(public|private|protected|static|class|void|return|final|new|if|int|double|boolean|long|float|byte|short|char|extends|this)\b/g,
    '<span class="inline-kw">$1</span>'
  );
  out = out.replace(
    /\b(String|System|Math|List|Usuario|Calculadora|Carro|Animal|Main)\b/g,
    '<span class="inline-ty">$1</span>'
  );
  return out;
}

export function highlightJava(code) {
  const slots = [];
  let n = 0;

  function stash(html) {
    const id = `@@HL${n++}@@`;
    slots.push({ id, html });
    return id;
  }

  let out = escapeHtml(code);

  out = out.replace(/(\/\/.*$)/gm, (m) => stash(`<span class="cm">${m}</span>`));
  out = out.replace(/("(?:[^"\\]|\\.)*")/g, (m) => stash(`<span class="st">${m}</span>`));

  out = out
    .replace(/\b(@\w+)\b/g, '<span class="ann">$1</span>')
    .replace(
      /\b(public|private|protected|static|class|void|return|final|new|if|int|double|boolean|long|float|byte|short|char|true|false)\b/g,
      '<span class="kw">$1</span>'
    )
    .replace(
      /\b(String|System|Scanner|List|Todo|Calculadora|Usuario|Conta|Matematica|RequestBody|Carro)\b/g,
      '<span class="ty">$1</span>'
    )
    .replace(/\b(\d+(?:\.\d+)?[fLd]?)\b/g, '<span class="nu">$1</span>');

  for (const { id, html } of slots) {
    out = out.split(id).join(html);
  }

  return out;
}
