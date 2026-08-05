function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const GALLERY_CONFIG = [
  { root: ".books-gallery", selector: "a.book-cover-link" },
  { root: ".ides-gallery", selector: "a.ide-cover-link" }
];

function initGallery(rootSelector, linkSelector) {
  const { lightGallery, lgThumbnail, lgZoom, lgFullscreen, lgShare, lgRotate } = window;
  if (!lightGallery) return;

  document.querySelectorAll(rootSelector).forEach((gallery) => {
    if (gallery.dataset.lgInit === "true") return;
    gallery.dataset.lgInit = "true";

    lightGallery(gallery, {
      selector: linkSelector,
      plugins: [lgThumbnail, lgZoom, lgFullscreen, lgShare, lgRotate],
      licenseKey: "0000-0000-000-0000",
      speed: 350,
      download: true,
      counter: true,
      thumbnail: true,
      zoom: true,
      fullScreen: true,
      share: true,
      rotate: true,
      mobileSettings: {
        controls: true,
        showCloseIcon: true,
        download: true
      },
      strings: {
        closeGallery: "Fechar",
        toggleMaximize: "Tela cheia",
        previousSlide: "Anterior",
        nextSlide: "Próxima",
        download: "Baixar"
      }
    });
  });
}

export function initBooksGallery() {
  GALLERY_CONFIG.forEach(({ root, selector }) => initGallery(root, selector));
}

export function bookCoverSubHtml(book) {
  const parts = [`<h4>${escapeAttr(book.title)}</h4>`];
  if (book.author) parts.push(`<p>${escapeAttr(book.author)}</p>`);
  return parts.join("");
}

export function ideCoverSubHtml(ide) {
  const parts = [`<h4>${escapeAttr(ide.name)}</h4>`];
  if (ide.tag) parts.push(`<p>${escapeAttr(ide.tag)}</p>`);
  return parts.join("");
}
