import { state } from "./state.js";
import { escapeHtml, displayBuiltinCode } from "./utils.js";
import { formatText } from "./format.js";
import { icon } from "./icon.js";
import {
  header,
  layout,
  renderDetails,
  renderAlert,
  renderCardItems
} from "./layout.js";
import { renderCodeBlock, codeOpts, renderCodeWindowWithOutput } from "./code-window.js";
import { bookCoverSubHtml, ideCoverSubHtml } from "./books-gallery.js";
import {
  buildBuiltinInputs,
  registerBuiltinTemplate,
  renderBuiltinTerminalCard,
  renderBuiltinFields,
  renderBuiltinRunPanel,
  renderTerminalOutputOverlay
} from "./builtin.js";

function renderCover(slide) {
  return `
      <div class="slide-shell slide-cover">
        <div class="cover-inner">
          <div class="cover-mark">${icon("coffee", 56)}</div>
          <p class="cover-badge">${escapeHtml(slide.badge)}</p>
          <h1 class="cover-title">${escapeHtml(slide.title)}</h1>
          <p class="cover-sub">${escapeHtml(slide.subtitle)}</p>
          <p class="cover-footer">${escapeHtml(slide.footer)}</p>
        </div>
      </div>`;
}

function renderAbout(slide) {
  const sections = (slide.sections || [])
    .map(
      (sec) => `
        <article class="about-section">
          <span class="about-section-marker" aria-hidden="true"></span>
          <div class="about-section-body">
            <h3>${escapeHtml(sec.title)}</h3>
            <ul>${(sec.items || []).map((item) => `<li>${formatText(item)}</li>`).join("")}</ul>
          </div>
        </article>`
    )
    .join("");

  const imagePath = slide.image || "images/presenter/daniel.jpg";
  const imagePosition = slide.imagePosition || "center top";
  const photo = `
      <figure class="about-photo-wrap">
        <img
          class="about-photo"
          src="${escapeHtml(imagePath)}"
          alt="${escapeHtml(slide.imageAlt || slide.name || "Foto do instrutor")}"
          style="object-position: ${escapeHtml(imagePosition)}"
          loading="lazy"
          onerror="this.closest('.about-photo-wrap').classList.add('about-photo-wrap--missing'); this.hidden=true;"
        />
        <div class="about-photo-fallback" aria-hidden="true">
          ${icon("user", 72)}
          <p>Adicione sua foto em <code>images/presenter/</code></p>
        </div>
      </figure>`;

  const logo = slide.logo
    ? `<img class="about-logo" src="${escapeHtml(slide.logo)}" alt="" loading="lazy" onerror="this.hidden=true" />`
    : "";

  return `
      <div class="slide-shell slide-shell--about">
        <div class="slide-body slide-body--about">
          <div class="about-layout">
            <div class="about-content">
              <h1 class="about-name">${escapeHtml(slide.name)}</h1>
              <div class="about-sections">${sections}</div>
              ${logo}
            </div>
            ${photo}
          </div>
        </div>
      </div>`;
}

function renderOrigin(slide) {
  const timeline = slide.timeline
    .map(
      (t) => `
        <li>
          <span class="timeline-year">${escapeHtml(t.year)}</span>
          <span class="timeline-event">${escapeHtml(t.event)}</span>
        </li>`
    )
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <ul class="timeline">${timeline}</ul>
        ${slide.note ? `<p class="slide-note">${formatText(slide.note)}</p>` : ""}
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderCards(slide) {
  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderCardItems(slide.cards)}
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderIdes(slide) {
  const cards = (slide.ides || [])
    .map(
      (ide) => `
        <article class="ide-card">
          <div class="ide-cover-wrap">
            <a
              class="ide-cover-link"
              href="${escapeHtml(ide.cover)}"
              data-download-url="${escapeHtml(ide.cover)}"
              data-sub-html="${ideCoverSubHtml(ide).replace(/"/g, "&quot;")}"
            >
              <img
                class="ide-cover"
                src="${escapeHtml(ide.cover)}"
                alt="${escapeHtml(ide.name)}"
                loading="lazy"
              />
            </a>
          </div>
          <div class="ide-meta">
            <div class="ide-top">
              <h3 class="ide-name">${escapeHtml(ide.name)}</h3>
              ${ide.tag ? `<span class="ide-tag">${escapeHtml(ide.tag)}</span>` : ""}
            </div>
            <p class="ide-desc">${formatText(ide.description || ide.desc || "")}</p>
            ${
              ide.url
                ? `<a class="ide-open-link" href="${escapeHtml(ide.url)}" target="_blank" rel="noopener noreferrer">
              <span>Site oficial</span>
              ${icon("arrow-right", 16)}
            </a>`
                : ""
            }
          </div>
        </article>`
    )
    .join("");

  const main = `
      <div class="slide-main slide-main--ides">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead slide-lead--compact">${formatText(slide.lead)}</p>
        <div class="ides-gallery ides-grid">${cards}</div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderSplit(slide) {
  const rulesHtml = slide.rules && slide.rules.length
    ? `<ul class="split-rules">${slide.rules
        .map((r) => `<li>${formatText(r)}</li>`)
        .join("")}</ul>`
    : "";
  const cardsHtml = slide.cards ? renderCardItems(slide.cards, true) : "";
  const sideContent = `${rulesHtml}${cardsHtml}`;

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <div class="split-layout">
          <div class="split-text">
            <p class="slide-lead">${formatText(slide.lead)}</p>
            ${renderDetails(slide.details)}
            ${renderAlert(slide.alert)}
            ${sideContent}
          </div>
          ${renderCodeBlock(slide.code, codeOpts(slide))}
        </div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderOperatorTable(section) {
  if (!section?.rows?.length) return "";
  const head = section.columns.map((c) => `<th>${formatText(c)}</th>`).join("");
  const body = section.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${formatText(cell)}</td>`).join("")}</tr>`
    )
    .join("");

  return `
    <div class="operators-table-block">
      ${section.heading ? `<h3 class="operators-table-title">${escapeHtml(section.heading)}</h3>` : ""}
      <div class="data-table-wrap data-table-wrap--compact">
        <table class="data-table data-table--operators">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>`;
}

function renderOperators(slide) {
  const tables = `
    <div class="operators-tables">
      ${renderOperatorTable(slide.comparison)}
      ${renderOperatorTable(slide.logical)}
    </div>`;

  const codePanel = slide.code
    ? `<div class="operators-code">${renderCodeBlock(slide.code, codeOpts(slide))}</div>`
    : "";

  const main = `
      <div class="slide-main slide-main--operators">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <div class="operators-layout">
          <div class="operators-text">
            ${tables}
            ${renderAlert(slide.alert)}
            ${slide.cards ? renderCardItems(slide.cards, true) : ""}
          </div>
          ${codePanel}
        </div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderTable(slide) {
  const head = slide.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = slide.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <div class="data-table-wrap">
          <table class="data-table">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        ${slide.note ? `<p class="slide-note">${formatText(slide.note)}</p>` : ""}
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderFlow(slide) {
  const steps = slide.steps
    .map(
      (s) => `
        <div class="flow-step">
          <div class="flow-icon">${icon(s.icon, 36)}</div>
          <div class="flow-label">${escapeHtml(s.label)}</div>
          <div class="flow-detail">${escapeHtml(s.detail)}</div>
          <span class="flow-file">${escapeHtml(s.file)}</span>
        </div>`
    )
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <div class="flow-body">
          <div class="flow-row">${steps}</div>
          <div class="terminal-block">${escapeHtml(slide.terminal)}</div>
        </div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderGrid(slide) {
  const canRun = state.pistonConfig?.enabled && slide.run && slide.run.enabled;

  const items = slide.items
    .map((item, index) => {
      const runId = `builtin-${slide.id}-${index}`;
      const showRun = canRun && item.run && item.run.code;

      if (showRun) {
        state.builtinTemplates.set(runId, {
          code: item.run.code,
          inputs: item.run.inputs || []
        });
      }

      return `
        <div class="builtin-item${showRun ? " builtin-item--interactive" : ""}">
          <div class="builtin-head">
            <span class="builtin-icon">${icon(item.icon, 30)}</span>
            <h3>${escapeHtml(item.name)}</h3>
          </div>
          <p>${escapeHtml(item.desc)}</p>
          <code class="builtin-example">${escapeHtml(item.example)}</code>
          ${
            showRun
              ? `
          <div class="builtin-item-run">
            ${renderBuiltinFields(item.run, runId)}
            ${renderBuiltinRunPanel(runId)}
            ${renderTerminalOutputOverlay(runId)}
          </div>`
              : ""
          }
        </div>`;
    })
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <div class="builtin-grid">${items}</div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderBuiltinDemo(slide) {
  const runId = `builtin-slide-${slide.id}`;
  const staticOutput = slide.run && slide.run.expectedOutput;
  const useStaticOutput = staticOutput != null && staticOutput !== "";
  const canRun =
    !useStaticOutput &&
    state.pistonConfig?.enabled &&
    slide.run &&
    slide.run.enabled !== false &&
    slide.run.code;

  const allInputs = buildBuiltinInputs(slide);

  if (canRun) {
    registerBuiltinTemplate(runId, slide, allInputs);
  }

  const methods = (slide.methods || []).slice(0, 5)
    .map(
      (m) => `
        <li class="builtin-method-item">
          <div class="builtin-method-head">
            <code class="builtin-method-name">${escapeHtml(m.name)}</code>
          </div>
          <p>${formatText(m.desc)}</p>
        </li>`
    )
    .join("");

  const cardsHtml = slide.cards?.length
    ? renderCardItems(slide.cards, true)
    : "";

  const playground = `
      <div class="builtin-playground builtin-playground--terminal" data-run-id="${escapeHtml(runId)}">
        ${renderBuiltinTerminalCard({
          code: displayBuiltinCode(slide.code),
          fileName: slide.title + ".java",
          run: slide.run,
          runId,
          canRun,
          staticOutput: useStaticOutput ? staticOutput : null
        })}
      </div>`;

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">
          <span class="builtin-demo-icon">${icon(slide.icon, 30)}</span>
          ${escapeHtml(slide.title)}
        </h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        <div class="builtin-demo-layout">
          <div class="builtin-demo-methods">
            <h3>Métodos principais</h3>
            <ul class="builtin-method-list">${methods}</ul>
            ${cardsHtml}
          </div>
          ${playground}
        </div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderBuiltinsTable(slide) {
  const head = slide.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = slide.rows
    .map(
      (row) =>
        `<tr>
            <td class="cell-class">${escapeHtml(row[0])}</td>
            <td>${escapeHtml(row[1])}</td>
            <td><code>${escapeHtml(row[2])}</code></td>
          </tr>`
    )
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <div class="data-table-wrap">
          <table class="data-table data-table--builtins">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderCodeTabs(slide, index) {
  const uid = `tabs-${index}`;
  const buttons = slide.tabs
    .map(
      (tab, i) =>
        `<button class="tab-btn${i === 0 ? " active" : ""}" data-tab="${uid}-${i}" type="button">${escapeHtml(tab.name)}</button>`
    )
    .join("");

  const panels = slide.tabs
    .map(
      (tab, i) =>
        `<div class="tab-panel${i === 0 ? " active" : ""}" id="${uid}-${i}">${renderCodeBlock(tab.code, codeOpts(slide, { runId: `slide-${slide.id}-tab-${i}`, filename: tab.filename || slide.filename, run: tab.run }))}</div>`
    )
    .join("");

  const main = `
      <div class="slide-main" data-tab-group="${uid}">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <div class="tab-bar">${buttons}</div>
        ${panels}
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderPillars(slide) {
  const pillars = slide.pillars
    .map(
      (p) => `
        <article class="pillar-card">
          <div class="pillar-icon">${icon(p.icon, 36)}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <p>${formatText(p.desc)}</p>
        </article>`
    )
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <div class="pillars-grid">${pillars}</div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderPractice(slide) {
  const steps = (slide.ideSteps || [])
    .map(
      (step, i) => `
        <li class="practice-step">
          <span class="practice-step-num">${i + 1}</span>
          <span>${formatText(step)}</span>
        </li>`
    )
    .join("");

  const topics = (slide.topics || [])
    .map((t) => `<li>${formatText(t)}</li>`)
    .join("");

  const filePath = slide.practiceFile || "";
  const fileLink = filePath
    ? `<a class="practice-file-link" href="${escapeHtml(filePath)}" target="_blank" rel="noopener noreferrer">
        ${icon("file-text", 20)}
        <span>Abrir roteiro: ${escapeHtml(filePath.split("/").pop())}</span>
        ${icon("external-link", 16)}
      </a>`
    : "";

  const main = `
      <div class="slide-main slide-main--practice">
        <div class="practice-hero">
          <div class="practice-hero-icon">${icon(slide.icon || "laptop", 48)}</div>
          <h2 class="slide-title practice-title">${escapeHtml(slide.title)}</h2>
          <p class="slide-lead practice-lead">${formatText(slide.lead)}</p>
          ${slide.duration ? `<p class="practice-duration">${icon("clock", 20)} ${escapeHtml(slide.duration)}</p>` : ""}
        </div>
        <div class="practice-layout">
          <div class="practice-panel">
            <h3>${icon("list-checks", 24)} Na IDE agora</h3>
            <ol class="practice-steps">${steps}</ol>
            ${fileLink}
          </div>
          <div class="practice-panel">
            <h3>${icon("check-circle", 24)} O que praticar</h3>
            <ul class="practice-topics">${topics}</ul>
            ${slide.note ? `<p class="practice-note">${formatText(slide.note)}</p>` : ""}
          </div>
        </div>
      </div>`;

  return `<div class="slide-shell slide-shell--practice">${header(slide)}${layout(slide, main)}</div>`;
}

function renderProject(slide) {
  const tags = slide.stack.map((s) => `<span class="stack-tag">${escapeHtml(s)}</span>`).join("");
  const files = slide.structure
    .map((f) => `<li>${icon("file-code", 22)}<span>${escapeHtml(f)}</span></li>`)
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        ${renderDetails(slide.details)}
        <div class="stack-tags">${tags}</div>
        <ul class="file-tree">${files}</ul>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderBooks(slide) {
  const books = (slide.books || [])
    .map(
      (book) => `
        <article class="book-card">
          <div class="book-cover-wrap">
            <a
              class="book-cover-link"
              href="${escapeHtml(book.cover)}"
              data-download-url="${escapeHtml(book.cover)}"
              data-sub-html="${bookCoverSubHtml(book).replace(/"/g, "&quot;")}"
            >
              <img class="book-cover" src="${escapeHtml(book.cover)}" alt="Capa: ${escapeHtml(book.title)}" loading="lazy" />
            </a>
          </div>
          <div class="book-meta">
            <h3>${escapeHtml(book.title)}</h3>
            ${book.subtitle ? `<p class="book-subtitle">${escapeHtml(book.subtitle)}</p>` : ""}
            ${book.author ? `<p class="book-author">${escapeHtml(book.author)}</p>` : ""}
            ${book.description ? `<p class="book-desc">${formatText(book.description)}</p>` : ""}
            ${
              book.url
                ? `<a class="book-open-link" href="${escapeHtml(book.url)}" target="_blank" rel="noopener noreferrer">
              <span>Ver livro</span>
              ${icon("arrow-right", 16)}
            </a>`
                : ""
            }
          </div>
        </article>`
    )
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        <div class="books-gallery books-grid">${books}</div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderRecap(slide) {
  const days = slide.days
    .map((d, i) => {
      const topics = d.topics.map((t) => `<li>${formatText(t)}</li>`).join("");
      return `
          <div class="recap-day${i === 1 ? " dia-2" : ""}">
            <h3>${icon(d.icon, 30)} ${escapeHtml(d.label)}</h3>
            <ul>${topics}</ul>
          </div>`;
    })
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <div class="recap-grid">${days}</div>
        <p class="recap-cta">${escapeHtml(slide.cta)}</p>
      </div>`;

  return `
      <div class="slide-shell">
        ${layout(slide, main)}
      </div>`;
}

function renderOopIntro(slide) {
  const concepts = slide.concepts
    .map(
      (c) => `
        <article class="oop-concept">
          <div class="oop-concept-icon">${icon(c.icon, 28)}</div>
          <div>
            <h3>${escapeHtml(c.term)}</h3>
            <p>${formatText(c.def)}</p>
          </div>
        </article>`
    )
    .join("");

  const main = `
      <div class="slide-main">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        <p class="slide-lead">${formatText(slide.lead)}</p>
        <div class="oop-layout">
          <div class="oop-concepts">${concepts}</div>
          ${renderCodeBlock(slide.code, codeOpts(slide))}
        </div>
      </div>`;

  return `<div class="slide-shell">${header(slide)}${layout(slide, main)}</div>`;
}

function renderDndSort(slide) {
  const zonesClass = slide.zonesClass || "";
  const zones = (slide.categories || [])
    .map(
      (cat) => `
        <div class="dnd-zone" data-category="${escapeHtml(cat.id)}">
          <div class="dnd-zone-head">
            ${icon(cat.icon || "box", 26)}
            <h3>${escapeHtml(cat.label)}</h3>
          </div>
          <div class="dnd-drop" data-drop-zone></div>
        </div>`
    )
    .join("");

  const chips = (slide.items || [])
    .map(
      (item) => `
        <div
          class="dnd-chip"
          draggable="true"
          data-item-id="${escapeHtml(item.id)}"
          data-category="${escapeHtml(item.category)}"
        >
          <span class="dnd-chip-grip">${icon("grip-vertical", 16)}</span>
          <span class="dnd-chip-text">${escapeHtml(item.text)}</span>
        </div>`
    )
    .join("");

  const hintBlock = slide.hint
    ? `<p class="dnd-hint">${icon("move", 18)} ${formatText(slide.hint)}</p>`
    : "";

  const activity = `
        <div class="dnd-activity" data-activity-id="${slide.id}" data-prevent-swipe>
          ${hintBlock}
          <div class="dnd-bank">
            <p class="dnd-bank-label">Itens para arrastar</p>
            <div class="dnd-drop dnd-bank-drop" data-drop-zone>${chips}</div>
          </div>
          <div class="dnd-zones ${zonesClass}">${zones}</div>
          <div class="dnd-actions">
            <button type="button" class="dnd-check-btn">
              ${icon("check", 22)}
              <span>Verificar</span>
            </button>
            <button type="button" class="dnd-reset-btn">
              ${icon("eraser", 22)}
              <span>Limpar</span>
            </button>
          </div>
          <p class="dnd-feedback" role="status" aria-live="polite"></p>
        </div>`;

  const sidePanel =
    slide.code && slide.output
      ? `<aside class="dnd-side-panel">${renderCodeWindowWithOutput(slide.code, slide.output, {
          filename: slide.filename || "Main.java"
        })}</aside>`
      : "";

  const layoutClass = sidePanel ? "dnd-layout-split" : "dnd-layout-single";

  const main = `
      <div class="slide-main slide-main--dnd">
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
        ${slide.lead ? `<p class="slide-lead">${formatText(slide.lead)}</p>` : ""}
        <div class="${layoutClass}">
          ${activity}
          ${sidePanel}
        </div>
      </div>`;

  return `<div class="slide-shell slide-shell--dnd">${header(slide)}${layout(slide, main)}</div>`;
}

export const RENDERERS = {
  cover: renderCover,
  about: renderAbout,
  origin: renderOrigin,
  cards: renderCards,
  ides: renderIdes,
  split: renderSplit,
  operators: renderOperators,
  table: renderTable,
  flow: renderFlow,
  grid: renderGrid,
  "builtin-demo": renderBuiltinDemo,
  "builtins-table": renderBuiltinsTable,
  "code-tabs": renderCodeTabs,
  "oop-intro": renderOopIntro,
  "dnd-sort": renderDndSort,
  pillars: renderPillars,
  project: renderProject,
  books: renderBooks,
  recap: renderRecap,
  practice: renderPractice
};

export function renderSlide(slide, index, total) {
  const fn = RENDERERS[slide.type];
  if (!fn) return `<section><p>Tipo desconhecido: ${slide.type}</p></section>`;

  slide._page = index + 1;
  slide._total = total;
  return `<section data-slide-id="${slide.id}">${fn(slide, index)}</section>`;
}
