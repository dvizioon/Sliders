import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const slideDir = path.join(root, "data", "slides");

const SKIP_KEYS = new Set(["code", "terminal", "filename", "image", "cover", "logo", "url", "practiceFile"]);

function fixArrowText(str, key) {
  if (key === "expectedOutput") {
    return str.replace(/→\s*/g, "Resposta: ");
  }
  return str.replace(/→/g, " {{arrow}} ").replace(/ {2,}/g, " ").trim();
}

function fixArrows(value, key) {
  if (typeof value === "string") {
    if (!value.includes("→")) return value;
    if (SKIP_KEYS.has(key)) return value;
    return fixArrowText(value, key);
  }
  if (Array.isArray(value)) {
    return value.map((item) => fixArrows(item, key));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = fixArrows(v, k);
    }
    return out;
  }
  return value;
}

function processFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const fixed = fixArrows(data, "");
  fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2) + "\n");
  console.log("OK", path.relative(root, filePath));
}

for (const file of fs.readdirSync(slideDir)) {
  if (file.endsWith(".json")) {
    processFile(path.join(slideDir, file));
  }
}

const deck = JSON.parse(fs.readFileSync(path.join(root, "data", "deck.json"), "utf8"));
const slides = deck.parts.flatMap((part) => {
  const partPath = path.join(root, part.replace(/^data\//, "data/"));
  const resolved = part.startsWith("data/") ? path.join(root, part) : path.join(root, "data", part);
  return JSON.parse(fs.readFileSync(resolved, "utf8")).slides || [];
});

fs.writeFileSync(
  path.join(root, "data", "slides.json"),
  JSON.stringify({ meta: deck.meta, slides }, null, 2) + "\n"
);
console.log("OK data/slides.json (consolidado)");
