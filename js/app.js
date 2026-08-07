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
  const deckRes = await fetch("data/deck.json?v=1");
  const deck = await deckRes.json();
  const partResponses = await Promise.all(
    deck.parts.map((part) => fetch(`${part}?v=1`))
  );
  const partData = await Promise.all(partResponses.map((r) => r.json()));
  const slidesFromDeck = partData.flatMap((part) => part.slides || []);

  const [booksRes, idesRes] = await Promise.all([
    fetch("data/books.json?v=7"),
    fetch("data/ides.json?v=3")
  ]);
  const booksData = await booksRes.json();
  const idesData = await idesRes.json();

  state.pistonConfig = deck.meta.piston || null;
  state.showDayTag = deck.meta.showDayTag === true;

  await initExecution(state.pistonConfig);

  const bookList = booksData.books || [];
  const ideList = idesData.ides || [];
  const slides = activeSlides(slidesFromDeck).map((slide) => {
    if (slide.type === "books") return { ...slide, books: bookList };
    if (slide.type === "ides") return { ...slide, ides: ideList };
    return slide;
  });
  const total = slides.length;

  state.slides = slides;
  state.meta = deck.meta;
  state.runSources.clear();
  state.builtinTemplates.clear();

  document.title = `${deck.meta.title} | ${deck.meta.subtitle}`;
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

  initExportMenu(deck.meta, slides);
  updateDeckPageBadge(slides);
  Reveal.on("slidechanged", () => updateDeckPageBadge(slides));
}

document.addEventListener("DOMContentLoaded", init);
