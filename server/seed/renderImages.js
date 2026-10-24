// Renders the seed catalogue's product photos to seed/images/*.webp.
// Run with `npm run render-images` after changing seed/catalog.js or
// seed/jersey.js. Pass --sheet to also write a contact sheet for review.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { products } from "./catalog.js";
import { renderJersey } from "./jersey.js";
import { slugify } from "../src/utils/text.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(here, "images");
const FONT_FILES = ["700", "800", "900"].map((w) => path.join(here, "fonts", `BigShoulders-${w}.ttf`));
export const VIEWS = ["front", "back", "detail"];
const WIDTH = 1200;

export function imagePath(slug, view) {
  return path.join(OUT_DIR, `${slug}-${view}.webp`);
}

async function renderOne(spec, view) {
  const svg = renderJersey(spec, view);
  const png = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Big Shoulders Display" },
    fitTo: { mode: "width", value: WIDTH },
  })
    .render()
    .asPng();
  return sharp(png).webp({ quality: 84, effort: 5 }).toBuffer();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const sheet = process.argv.includes("--sheet");
  const thumbs = [];
  let bytes = 0;

  for (const product of products) {
    const slug = slugify(product.name);
    for (const view of VIEWS) {
      const buffer = await renderOne(product.kit, view);
      bytes += buffer.length;
      await fs.writeFile(imagePath(slug, view), buffer);
      if (sheet && view === "front") thumbs.push(await sharp(buffer).resize(240).toBuffer());
    }
    process.stdout.write(".");
  }
  console.log(`\nRendered ${products.length * VIEWS.length} images (${(bytes / 1024 / 1024).toFixed(1)} MB) to ${OUT_DIR}`);

  if (sheet) {
    const cols = 6;
    const rows = Math.ceil(thumbs.length / cols);
    const file = path.join(OUT_DIR, "..", "contact-sheet.png");
    await sharp({ create: { width: cols * 240, height: rows * 300, channels: 3, background: "#ffffff" } })
      .composite(thumbs.map((input, i) => ({ input, left: (i % cols) * 240, top: Math.floor(i / cols) * 300 })))
      .png()
      .toFile(file);
    console.log(`Contact sheet: ${file}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
