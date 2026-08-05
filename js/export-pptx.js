/** Exporta slides para PPTX com texto editável (PptxGenJS) */

const C = {
  bg: "1A1E28",
  title: "F1F5F9",
  body: "CBD5E1",
  accent: "0088CC",
  muted: "64748B",
  codeBg: "0F1219",
  codeBorder: "374151",
  codeText: "E2E8F0"
};

function plain(str) {
  if (str == null) return "";
  return String(str).replace(/`([^`]+)`/g, "$1");
}

function newSlide(pptx) {
  const slide = pptx.addSlide();
  slide.background = { color: C.bg };
  return slide;
}

function addHeading(slide, text, y = 0.3) {
  slide.addText(text, {
    x: 0.45,
    y,
    w: 9.1,
    h: 0.55,
    fontSize: 26,
    bold: true,
    color: C.title,
    fontFace: "Arial"
  });
}

function addSubheading(slide, text, y) {
  slide.addText(text, {
    x: 0.45,
    y,
    w: 9.1,
    h: 0.35,
    fontSize: 13,
    color: C.body,
    fontFace: "Arial"
  });
}

function addParagraph(slide, text, y, h = 0.45) {
  if (!text) return y;
  slide.addText(plain(text), {
    x: 0.45,
    y,
    w: 9.1,
    h,
    fontSize: 12,
    color: C.body,
    fontFace: "Arial",
    valign: "top"
  });
  return y + h;
}

function addBulletList(slide, items, y, opts = {}) {
  if (!items?.length) return y;
  const w = opts.w ?? 9.1;
  const x = opts.x ?? 0.45;
  const h = opts.h ?? Math.min(4.2, 0.28 * items.length + 0.2);
  const rows = items.map((item) => ({
    text: plain(item),
    options: { bullet: true, fontSize: opts.fontSize ?? 11, color: C.body, breakLine: true }
  }));
  slide.addText(rows, { x, y, w, h, fontFace: "Arial", valign: "top" });
  return y + h;
}

function addCode(slide, code, x, y, w, h) {
  if (!code) return;
  slide.addShape("rect", {
    x,
    y,
    w,
    h,
    fill: { color: C.codeBg },
    line: { color: C.codeBorder, width: 0.75 }
  });
  slide.addText(code, {
    x: x + 0.12,
    y: y + 0.1,
    w: w - 0.24,
    h: h - 0.2,
    fontSize: 8.5,
    fontFace: "Courier New",
    color: C.codeText,
    valign: "top"
  });
}

function addTable(slide, columns, rows, y) {
  const head = columns.map((col) => ({
    text: col,
    options: { bold: true, color: C.title, fill: { color: "252A38" } }
  }));
  const body = rows.map((row) =>
    row.map((cell) => ({ text: plain(cell), options: { color: C.body } }))
  );
  slide.addTable([head, ...body], {
    x: 0.45,
    y,
    w: 9.1,
    fontSize: 10,
    fontFace: "Arial",
    border: { type: "solid", color: C.codeBorder, pt: 0.5 },
    colW: Array(columns.length).fill(9.1 / columns.length)
  });
}

function exportCover(pptx, slide) {
  const s = newSlide(pptx);
  s.addText(slide.badge || "", {
    x: 0.45,
    y: 1.4,
    w: 9.1,
    h: 0.35,
    fontSize: 12,
    color: C.accent,
    align: "center",
    fontFace: "Arial"
  });
  s.addText(slide.title, {
    x: 0.45,
    y: 1.9,
    w: 9.1,
    h: 1,
    fontSize: 36,
    bold: true,
    color: C.title,
    align: "center",
    fontFace: "Arial"
  });
  s.addText(slide.subtitle, {
    x: 0.45,
    y: 2.95,
    w: 9.1,
    h: 0.5,
    fontSize: 16,
    color: C.body,
    align: "center",
    fontFace: "Arial"
  });
  if (slide.footer) {
    s.addText(slide.footer, {
      x: 0.45,
      y: 4.8,
      w: 9.1,
      h: 0.35,
      fontSize: 11,
      color: C.muted,
      align: "center",
      fontFace: "Arial"
    });
  }
}

function exportOrigin(pptx, slide) {
  const s = newSlide(pptx);
  let y = 0.3;
  addHeading(s, slide.title, y);
  y = addParagraph(s, slide.lead, 0.95, 0.55);
  y = addBulletList(s, slide.details, y + 0.05, { h: 1.1 });
  if (slide.timeline?.length) {
    const lines = slide.timeline.map((t) => `${t.year}: ${t.event}`);
    y = addBulletList(s, lines, y + 0.1, { h: 1.6 });
  }
  if (slide.note) addParagraph(s, slide.note, y + 0.05, 0.4);
}

function exportCards(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  addParagraph(s, slide.lead, 0.95, 0.45);
  const cards = (slide.cards || []).map((c) => `${c.heading}: ${plain(c.body)}`);
  addBulletList(s, cards, 1.5, { h: 3.5 });
}

function exportIdes(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  let y = addParagraph(s, slide.lead, 0.95, 0.45);
  y = addBulletList(s, slide.details, y + 0.05, { h: 1 });
  const ides = (slide.ides || []).map((ide) => `${ide.name} (${ide.tag}): ${ide.description || ide.desc || ""}`);
  addBulletList(s, ides, y + 0.1, { h: 2.8 });
}

function exportSplit(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  addParagraph(s, slide.lead, 0.95, 0.45);
  let y = 1.5;
  if (slide.rules?.length) {
    y = addBulletList(s, slide.rules, y, { w: 4.3, h: 2.8 });
  }
  if (slide.cards?.length) {
    const cards = slide.cards.map((c) => `${c.heading}: ${plain(c.body)}`);
    addBulletList(s, cards, y, { w: 4.3, h: 2.8 });
  }
  if (slide.code) addCode(s, slide.code, 5.1, 1.45, 4.45, 3.6);
}

function exportTable(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  let y = addParagraph(s, slide.lead, 0.95, 0.4);
  if (slide.details?.length) y = addBulletList(s, slide.details, y + 0.05, { h: 0.9 });
  if (slide.columns && slide.rows) addTable(s, slide.columns, slide.rows, y + 0.15);
  if (slide.note) addParagraph(s, slide.note, 4.9, 0.35);
}

function exportFlow(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  addParagraph(s, slide.lead, 0.95, 0.4);
  if (slide.details?.length) addBulletList(s, slide.details, 1.45, { h: 0.8 });
  const steps = (slide.steps || []).map((st) => `${st.label}: ${st.detail} (${st.file})`);
  addBulletList(s, steps, 2.35, { w: 5.2, h: 2.5 });
  if (slide.terminal) addCode(s, slide.terminal, 5.6, 2.3, 4, 2.5);
}

function exportBuiltinDemo(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  addParagraph(s, slide.lead, 0.95, 0.4);
  const methods = (slide.methods || []).map((m) => `${m.name}: ${plain(m.desc)}`);
  addBulletList(s, methods, 1.45, { w: 4.5, h: 3.5 });
  if (slide.code) addCode(s, slide.code, 5.2, 1.4, 4.35, 3.6);
}

function exportBuiltinsTable(pptx, slide) {
  exportTable(pptx, slide);
}

function exportOopIntro(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  addParagraph(s, slide.lead, 0.95, 0.4);
  const concepts = (slide.concepts || []).map((c) => `${c.term}: ${plain(c.def)}`);
  addBulletList(s, concepts, 1.45, { w: 4.6, h: 3.2 });
  if (slide.code) addCode(s, slide.code, 5.3, 1.4, 4.25, 3.6);
}

function exportPillars(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  addParagraph(s, slide.lead, 0.95, 0.4);
  if (slide.details?.length) addBulletList(s, slide.details, 1.45, { h: 0.8 });
  const pillars = (slide.pillars || []).map((p) => `${p.name}: ${plain(p.desc)}`);
  addBulletList(s, pillars, 2.35, { h: 2.8 });
}

function exportProject(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  let y = addParagraph(s, slide.lead, 0.95, 0.45);
  if (slide.details?.length) y = addBulletList(s, slide.details, y + 0.05, { h: 1 });
  if (slide.stack?.length) {
    s.addText(`Stack: ${slide.stack.join(", ")}`, {
      x: 0.45,
      y: y + 0.1,
      w: 9.1,
      h: 0.35,
      fontSize: 11,
      color: C.accent,
      fontFace: "Arial"
    });
    y += 0.5;
  }
  if (slide.structure?.length) addBulletList(s, slide.structure, y + 0.1, { h: 2.5 });
}

function exportRecap(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  let y = 1;
  (slide.days || []).forEach((day, i) => {
    s.addText(day.label, {
      x: i === 0 ? 0.45 : 5.2,
      y,
      w: 4.4,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: C.accent,
      fontFace: "Arial"
    });
    addBulletList(s, day.topics, y + 0.4, { x: i === 0 ? 0.45 : 5.2, w: 4.4, h: 3.5 });
  });
  if (slide.cta) addParagraph(s, slide.cta, 4.85, 0.35);
}

function exportCodeTabs(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  addParagraph(s, slide.lead, 0.95, 0.4);
  if (slide.details?.length) addBulletList(s, slide.details, 1.45, { h: 0.7 });
  const first = slide.tabs?.[0];
  if (first?.code) {
    s.addText(first.name || first.filename || "Código", {
      x: 0.45,
      y: 2.25,
      w: 9.1,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: C.accent,
      fontFace: "Arial"
    });
    addCode(s, first.code, 0.45, 2.6, 9.1, 2.6);
  }
  if (slide.tabs?.length > 1) {
    const others = slide.tabs.slice(1).map((t) => t.name).join(", ");
    s.addText(`Outras abas: ${others}`, {
      x: 0.45,
      y: 5.3,
      w: 9.1,
      h: 0.25,
      fontSize: 9,
      color: C.muted,
      fontFace: "Arial"
    });
  }
}

function exportBooks(pptx, slide) {
  const s = newSlide(pptx);
  addHeading(s, slide.title);
  addParagraph(s, slide.lead, 0.95, 0.4);
  const books = (slide.books || []).map(
    (b) => `${b.title}${b.author ? ` (${b.author})` : ""}${b.url ? `\n${b.url}` : ""}`
  );
  addBulletList(s, books, 1.5, { h: 3.5 });
}

const EXPORTERS = {
  cover: exportCover,
  origin: exportOrigin,
  cards: exportCards,
  ides: exportIdes,
  split: exportSplit,
  table: exportTable,
  flow: exportFlow,
  grid: exportCards,
  "builtin-demo": exportBuiltinDemo,
  "builtins-table": exportBuiltinsTable,
  "code-tabs": exportCodeTabs,
  "oop-intro": exportOopIntro,
  pillars: exportPillars,
  project: exportProject,
  books: exportBooks,
  recap: exportRecap
};

export async function buildPptxFromSlides(slides, meta) {
  const pptx = new window.PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = meta?.title || "Apresentacao";
  pptx.author = meta?.author || "";

  slides.forEach((slide) => {
    const fn = EXPORTERS[slide.type];
    if (fn) fn(pptx, slide);
    else {
      const s = newSlide(pptx);
      addHeading(s, slide.title || `Slide ${slide.id}`);
      if (slide.lead) addParagraph(s, slide.lead, 1);
    }
  });

  return pptx;
}
