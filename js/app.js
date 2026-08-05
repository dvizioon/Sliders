import { activeSlides } from "./utils.js";
import { state } from "./state.js";
import { initExecution, applyOfflineUi } from "./piston.js";
import { renderSlide } from "./renderers.js";
import { bindRunButtons, bindTabs } from "./bindings.js";
import { initExportMenu, updateDeckPageBadge } from "./export-menu.js";
import { initBooksGallery } from "./books-gallery.js";
import { initDndActivities } from "./dnd-activity.js";

async function init() {
  const container = document.getElementById("slides-container");
  const [slidesRes, booksRes, idesRes] = await Promise.all([
    fetch("data/slides.json?v=82"),
    fetch("data/books.json?v=7"),
    fetch("data/ides.json?v=3")
  ]);
  const data = await slidesRes.json();
  const booksData = await booksRes.json();
  const idesData = await idesRes.json();

  state.pistonConfig = data.meta.piston || null;
  state.showDayTag = data.meta.showDayTag === true;

  await initExecution(state.pistonConfig);

  const bookList = booksData.books || [];
  const ideList = idesData.ides || [];
  const slides = activeSlides(data.slides).map((slide) => {
    if (slide.type === "books") return { ...slide, books: bookList };
    if (slide.type === "ides") return { ...slide, ides: ideList };
    return slide;
  });
  const total = slides.length;

  state.slides = slides;
  state.meta = data.meta;
  state.runSources.clear();
  state.builtinTemplates.clear();

  document.title = `${data.meta.title} | ${data.meta.subtitle}`;
  container.innerHTML = slides.map((s, i) => renderSlide(s, i, total)).join("");

  bindTabs();
  bindRunButtons();
  applyOfflineUi();
  initBooksGallery();
  initDndActivities();

  window.addEventListener("online", async () => {
    await initExecution(state.pistonConfig);
    applyOfflineUi();
  });

  window.addEventListener("offline", () => {
    state.executionAvailable = false;
    applyOfflineUi();
  });

  Reveal.initialize({
    hash: true,
    slideNumber: false,
    transition: "slide",
    backgroundTransition: "fade",
    width: 1920,
    height: 1080,
    margin: 0.04,
    controls: true,
    progress: true,
    center: false,
    pdfSeparateFragments: false
  });

  initExportMenu(data.meta, slides);
  updateDeckPageBadge(slides);
  Reveal.on("slidechanged", () => updateDeckPageBadge(slides));
}

document.addEventListener("DOMContentLoaded", init);
