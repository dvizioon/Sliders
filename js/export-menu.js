import { buildPptxFromSlides } from "./export-pptx.js";

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadPdfLib() {
  await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");
}

async function loadPptxLib() {
  await loadScript("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js");
}

function closeMenu(menu) {
  const dropdown = menu.querySelector(".export-menu-dropdown");
  const trigger = menu.querySelector(".export-menu-trigger");
  if (dropdown) dropdown.hidden = true;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
}

function setExportLoading(trigger, loading) {
  if (!trigger) return;
  if (loading) {
    trigger.dataset.prevHtml = trigger.innerHTML;
    trigger.disabled = true;
    trigger.innerHTML =
      '<iconify-icon icon="lucide:loader-circle" width="20" height="20"></iconify-icon>';
    return;
  }
  trigger.disabled = false;
  if (trigger.dataset.prevHtml) {
    trigger.innerHTML = trigger.dataset.prevHtml;
    delete trigger.dataset.prevHtml;
  }
}

function beginExportCapture() {
  document.body.classList.add("export-capture");
  if (typeof Reveal !== "undefined") {
    Reveal.configure({ controls: false, progress: false });
    Reveal.layout();
  }
}

function endExportCapture(startIndex) {
  document.body.classList.remove("export-capture");
  if (typeof Reveal !== "undefined") {
    Reveal.configure({ controls: true, progress: true });
    if (startIndex != null) Reveal.slide(startIndex);
    Reveal.layout();
  }
}

async function waitFrame(ms) {
  await new Promise((r) => window.setTimeout(r, ms || 320));
}

async function captureSlide(section) {
  const target = section.querySelector(".slide-shell") || section;
  return window.html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    width: target.offsetWidth,
    height: target.offsetHeight,
    windowWidth: target.scrollWidth,
    windowHeight: target.scrollHeight
  });
}

async function captureAllSlides() {
  const sections = document.querySelectorAll(".reveal .slides > section");
  const startIndex = typeof Reveal !== "undefined" ? Reveal.getIndices().h : 0;
  const images = [];

  beginExportCapture();

  try {
    for (let i = 0; i < sections.length; i++) {
      if (typeof Reveal !== "undefined") Reveal.slide(i);
      await waitFrame(380);

      const canvas = await captureSlide(sections[i]);
      images.push(canvas.toDataURL("image/jpeg", 0.94));
    }
  } finally {
    endExportCapture(startIndex);
  }

  return images;
}

async function exportToPdf(fileName, trigger) {
  setExportLoading(trigger, true);

  try {
    await loadPdfLib();
    const images = await captureAllSlides();

    const { jsPDF } = window.jspdf;
    const pageW = 297;
    const pageH = 167;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [pageW, pageH],
      compress: true
    });

    const margin = 6;
    const cardW = pageW - margin * 2;
    const cardH = pageH - margin * 2;

    images.forEach((img, index) => {
      if (index > 0) pdf.addPage([pageW, pageH], "landscape");

      pdf.setFillColor(18, 20, 26);
      pdf.rect(0, 0, pageW, pageH, "F");

      pdf.setFillColor(26, 30, 40);
      pdf.setDrawColor(55, 62, 78);
      pdf.setLineWidth(0.25);
      pdf.roundedRect(margin, margin, cardW, cardH, 3, 3, "FD");

      pdf.addImage(img, "JPEG", margin + 2, margin + 2, cardW - 4, cardH - 4, undefined, "FAST");
    });

    pdf.save(`${fileName}.pdf`);
  } finally {
    setExportLoading(trigger, false);
  }
}

async function exportToPptx(fileName, trigger, slides, meta) {
  setExportLoading(trigger, true);

  try {
    await loadPptxLib();
    const pptx = await buildPptxFromSlides(slides, meta);
    await pptx.writeFile({ fileName: `${fileName}.pptx` });
  } finally {
    setExportLoading(trigger, false);
  }
}

export function initExportMenu(meta, slides) {
  if (document.getElementById("export-menu")) return;

  const title = (meta && meta.title) || "Apresentacao";
  const safeName = title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "slides";

  const toolbar = document.createElement("div");
  toolbar.id = "deck-toolbar";
  toolbar.className = "deck-toolbar";

  const pageBadge = document.createElement("span");
  pageBadge.id = "deck-page-badge";
  pageBadge.className = "deck-page-badge";
  pageBadge.hidden = true;

  const menu = document.createElement("div");
  menu.id = "export-menu";
  menu.className = "export-menu";
  menu.innerHTML = `
    <button type="button" class="export-menu-trigger" aria-label="Exportar apresentação" aria-expanded="false" aria-haspopup="true">
      <iconify-icon icon="lucide:ellipsis-vertical" width="20" height="20"></iconify-icon>
    </button>
    <div class="export-menu-dropdown" hidden>
      <button type="button" class="export-menu-item" data-export="pdf">
        <iconify-icon icon="lucide:file-text" width="18" height="18"></iconify-icon>
        <span>PDF</span>
      </button>
      <button type="button" class="export-menu-item" data-export="pptx">
        <iconify-icon icon="lucide:presentation" width="18" height="18"></iconify-icon>
        <span>PPTX</span>
      </button>
    </div>`;

  toolbar.appendChild(pageBadge);
  toolbar.appendChild(menu);
  document.body.appendChild(toolbar);

  const trigger = menu.querySelector(".export-menu-trigger");
  const dropdown = menu.querySelector(".export-menu-dropdown");

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = dropdown.hidden;
    dropdown.hidden = !open;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  menu.querySelectorAll("[data-export]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      closeMenu(menu);
      const kind = btn.getAttribute("data-export");

      try {
        if (kind === "pdf") await exportToPdf(safeName, trigger);
        if (kind === "pptx") await exportToPptx(safeName, trigger, slides, meta);
      } catch (err) {
        console.error(err);
        window.alert("Não foi possível exportar. Tente novamente.");
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) closeMenu(menu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu(menu);
  });

  return { pageBadge, slides };
}

export function updateDeckPageBadge(slides) {
  const badge = document.getElementById("deck-page-badge");
  if (!badge || !window.Reveal) return;

  const index = Reveal.getIndices().h;
  const slide = slides[index];
  const current = index + 1;
  const total = slides.length;

  if (!slide) {
    badge.hidden = true;
    return;
  }

  badge.hidden = false;
  badge.textContent = String(current);
  badge.title = `Slide ${current} de ${total}`;
}
