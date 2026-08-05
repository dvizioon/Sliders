import { state } from "./state.js";
import { escapeHtml } from "./utils.js";
import { formatText } from "./format.js";
import { icon } from "./icon.js";

export function renderDetails(details) {
  if (!details || !details.length) return "";
  return `<ul class="detail-list">${details.map((d) => `<li>${formatText(d)}</li>`).join("")}</ul>`;
}

export function slideImage(slide) {
  if (!slide.image) return "";
  return `
    <figure class="slide-visual">
      <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.imageAlt || slide.title)}" loading="lazy" />
    </figure>`;
}

export function header(slide) {
  if (slide.type === "cover") return "";

  const dayClass = slide.day === 2 ? "dia-2" : "";
  const dayLabel = slide.day ? `Dia ${slide.day}` : "";
  const tag =
    state.showDayTag && dayLabel
      ? `<span class="day-tag ${dayClass}">${dayLabel}</span>`
      : "";

  if (!tag) return "";
  return `<header class="slide-header">${tag}</header>`;
}

export function layout(slide, mainHtml) {
  const visual = slideImage(slide);
  if (!visual) {
    return `<div class="slide-body slide-body--full">${mainHtml}</div>`;
  }
  return `
    <div class="slide-body slide-body--split">
      ${mainHtml}
      ${visual}
    </div>`;
}

export function renderAlert(alert) {
  if (!alert) return "";
  return `
    <div class="alert-card" role="note">
      <div class="alert-card-icon">${icon("info", 28)}</div>
      <div class="alert-card-body">
        <strong>${escapeHtml(alert.title)}</strong>
        <p>${formatText(alert.text)}</p>
      </div>
    </div>`;
}

export function renderCardItems(cards, compact) {
  if (!cards || !cards.length) return "";
  const singleClass = cards.length === 1 ? " cards-grid--single" : "";
  const gridClass = compact ? `cards-grid cards-grid--compact${singleClass}` : "cards-grid";
  const items = cards
    .map(
      (c) => `
        <article class="card-item">
          <div class="card-icon">${icon(c.icon, compact ? (cards.length === 1 ? 40 : 28) : 36)}</div>
          <h3>${escapeHtml(c.heading)}</h3>
          <p>${formatText(c.body)}</p>
        </article>`
    )
    .join("");
  return `<div class="${gridClass}">${items}</div>`;
}
