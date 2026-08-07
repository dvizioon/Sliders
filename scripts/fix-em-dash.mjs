import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const TITLE_KEYS = new Set(["title", "heading", "name", "label"]);

function fixEmDash(value, key) {
  if (typeof value === "string") {
    if (!value.includes("—")) return value;
    const sep = TITLE_KEYS.has(key) ? ": " : ", ";
    return value.replace(/ — /g, sep).replace(/—/g, sep.trim());
  }
  if (Array.isArray(value)) {
    return value.map((item) => fixEmDash(item, key));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = fixEmDash(v, k);
    }
    return out;
  }
  return value;
}

function processFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const fixed = fixEmDash(data, "");
  fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2) + "\n");
  console.log("OK", path.relative(root, filePath));
}

const slideDir = path.join(root, "data", "slides");
const files = [
  path.join(root, "data", "slides.json"),
  ...fs.readdirSync(slideDir).map((f) => path.join(slideDir, f))
];

for (const file of files) {
  if (file.endsWith(".json")) processFile(file);
}
