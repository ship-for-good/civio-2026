/**
 * Descarrega il·lustracions Storyset (llicència Freepik amb atribució)
 * i aplica el color de marca #EFB062.
 * Executar: node scripts/fetch-storyset-featured.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BRAND = "#EFB062";
const BRAND_DARK = "#D8954A";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "assets", "featured");

/** slug, style, fitxer de sortida */
const ILLUSTRATIONS = [
  {
    file: "featured-pressupost.svg",
    page: "https://storyset.com/illustration/pricing-plans/amico",
    svgUrl: "https://stories.freepiklabs.com/storage/48324/Pricing-Plans-amico_Mesa-de-trabajo-1.svg",
  },
  {
    file: "featured-infoparticipa.svg",
    page: "https://storyset.com/illustration/awards/rafiki",
    svgUrl: "https://stories.freepiklabs.com/storage/31990/Awards-RAFIKI_Artboard-1.svg",
  },
  {
    file: "featured-subvencions.svg",
    page: "https://storyset.com/illustration/charity/rafiki",
    svgUrl: "https://stories.freepiklabs.com/storage/15254/Charity_Artboard-1.svg",
  },
  {
    file: "featured-alts-carrecs.svg",
    page: "https://storyset.com/illustration/resume/rafiki",
    svgUrl: "https://stories.freepiklabs.com/storage/4371/Resume-01.svg",
  },
  {
    file: "featured-mobilitat.svg",
    page: "https://storyset.com/illustration/subway/rafiki",
    svgUrl: "https://stories.freepiklabs.com/storage/31988/Subway_Freepik_Artboard-1.svg",
  },
  {
    file: "featured-etica.svg",
    page: "https://storyset.com/illustration/feedback/rafiki",
    svgUrl: "https://stories.freepiklabs.com/storage/36012/Feedbackai_Artboard-1.svg",
  },
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function isNeutral(hex) {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  const s = max === min ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (l < 0.08 || l > 0.96) return true;
  if (s < 0.12) return true;
  return false;
}

function recolorSvg(svg) {
  const colors = [...new Set(svg.match(/#[0-9A-Fa-f]{6}/g) ?? [])];
  const accents = colors
    .filter((c) => !isNeutral(c))
    .sort((a, b) => {
      const la = hexToRgb(a).reduce((s, v) => s + v, 0);
      const lb = hexToRgb(b).reduce((s, v) => s + v, 0);
      return lb - la;
    });

  let out = svg;
  for (const old of accents) {
    const [r, g, b] = hexToRgb(old);
    const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
    const replacement = lightness < 0.45 ? BRAND_DARK : BRAND;
    const re = new RegExp(old.replace("#", "#"), "gi");
    out = out.replace(re, replacement);
  }
  return out;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const ill of ILLUSTRATIONS) {
  const res = await fetch(ill.svgUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (AIna demo; +https://github.com/ship-for-good/civio-2026)" },
  });
  if (!res.ok) throw new Error(`Failed ${ill.file}: ${res.status}`);
  const raw = await res.text();
  const colored = recolorSvg(raw);
  const path = join(OUT_DIR, ill.file);
  writeFileSync(path, colored, "utf8");
  console.log(`✓ ${ill.file} ← ${ill.page}`);
}

console.log(`\nIl·lustracions guardades a ${OUT_DIR}`);
