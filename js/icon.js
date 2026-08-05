export function icon(name, size) {
  const s = size || 24;
  return `<iconify-icon icon="lucide:${name}" width="${s}" height="${s}"></iconify-icon>`;
}
