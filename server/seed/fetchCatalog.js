// Builds the demo catalogue from DummyJSON (https://dummyjson.com), an
// open-source mock-data API with real studio product photography.
//
//   npm run fetch-catalog
//
// Writes seed/data/catalog.json and seed/images/*.webp. Both are committed,
// so `npm run seed` works offline and doesn't depend on DummyJSON staying up.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { slugify } from "../src/utils/text.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(here, "data");
const IMAGE_DIR = path.join(here, "images");
const SOURCE_CATEGORIES = ["mens-shoes", "womens-shoes", "mens-watches", "womens-watches", "sunglasses", "womens-bags", "mens-shirts", "tops", "sports-accessories"];
const USD_TO_INR = 83;

export const CATEGORIES = [
  { slug: "footwear", name: "Footwear", sortOrder: 1, description: "Trainers, cleats and heels, in UK sizes with free exchanges." },
  { slug: "watches", name: "Watches", sortOrder: 2, description: "Everyday steel, leather straps and the occasional grail." },
  { slug: "eyewear", name: "Eyewear", sortOrder: 3, description: "UV400 sunglasses for long afternoons in the stands." },
  { slug: "bags", name: "Bags", sortOrder: 4, description: "Totes, satchels and backpacks that carry a day's worth." },
  { slug: "clothing", name: "Clothing", sortOrder: 5, description: "Shirts and dresses in easy fabrics for warm weather." },
  { slug: "sports", name: "Sports gear", sortOrder: 6, description: "Bats, balls, rackets and helmets for weekend matches." },
];

const SIZE_RUNS = {
  mensShoes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
  womensShoes: ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"],
  mensClothing: ["S", "M", "L", "XL", "XXL"],
  womensClothing: ["XS", "S", "M", "L", "XL"],
  oneSize: ["One size"],
};

// DummyJSON id → how it appears in the store. Anything not listed is skipped.
const PICKS = {
  88: { category: "footwear", gender: "men", sizes: "mensShoes", featured: true, name: "Air Jordan 1 Retro High" },
  89: { category: "footwear", gender: "men", sizes: "mensShoes", name: "Diamond Turf Baseball Cleats" },
  90: { category: "footwear", gender: "men", sizes: "mensShoes", featured: true, name: "Future Rider Play On Trainers" },
  91: { category: "footwear", gender: "men", sizes: "mensShoes", name: "Out of Office Low Sneakers" },
  185: { category: "footwear", gender: "women", sizes: "womensShoes", name: "Black Block-Heel Sandals" },
  186: { category: "footwear", gender: "women", sizes: "womensShoes", featured: true, name: "Pointed Leather Pumps" },
  187: { category: "footwear", gender: "women", sizes: "womensShoes", name: "Rose Gold Pointed Heels" },
  188: { category: "footwear", gender: "women", sizes: "womensShoes", name: "Classic Black Court Heels" },
  189: { category: "footwear", gender: "women", sizes: "womensShoes", name: "Red Patent Stilettos" },
  93: { category: "watches", gender: "men", sizes: "oneSize", name: "Moonphase Leather Strap Watch" },
  94: { category: "watches", gender: "men", sizes: "oneSize", featured: true, name: "Master Collection Chronograph" },
  95: { category: "watches", gender: "men", sizes: "oneSize", name: "Cellini Date Black Dial" },
  96: { category: "watches", gender: "unisex", sizes: "oneSize", name: "Cellini Moonphase" },
  97: { category: "watches", gender: "men", sizes: "oneSize", name: "Datejust 41 Two-Tone" },
  98: { category: "watches", gender: "men", sizes: "oneSize", featured: true, name: "Submariner Date" },
  190: { category: "watches", gender: "women", sizes: "oneSize", name: "Ingenieur Automatic Steel" },
  192: { category: "watches", gender: "women", sizes: "oneSize", name: "Datejust 31 Two-Tone" },
  193: { category: "watches", gender: "women", sizes: "oneSize", name: "Gold Link Dress Watch" },
  194: { category: "watches", gender: "women", sizes: "oneSize", name: "Steel Bracelet Minimal Watch" },
  154: { category: "eyewear", gender: "unisex", sizes: "oneSize", name: "Tortoise Clubmaster Sunglasses" },
  155: { category: "eyewear", gender: "unisex", sizes: "oneSize", featured: true, name: "Gradient Aviator Sunglasses" },
  156: { category: "eyewear", gender: "unisex", sizes: "oneSize", name: "Green Lens Aviators" },
  158: { category: "eyewear", gender: "unisex", sizes: "oneSize", name: "Clear Square Shield Sunglasses" },
  172: { category: "bags", gender: "women", sizes: "oneSize", name: "Navy Structured Tote" },
  173: { category: "bags", gender: "women", sizes: "oneSize", name: "Tan Leather Hobo Bag" },
  174: { category: "bags", gender: "women", sizes: "oneSize", name: "Saffiano Leather Tote" },
  175: { category: "bags", gender: "unisex", sizes: "oneSize", featured: true, name: "White Faux Leather Backpack" },
  176: { category: "bags", gender: "women", sizes: "oneSize", name: "Black Satchel Handbag" },
  83: { category: "clothing", gender: "men", sizes: "mensClothing", name: "Blue Gingham Check Shirt" },
  85: { category: "clothing", gender: "men", sizes: "mensClothing", name: "Red Buffalo Plaid Shirt" },
  86: { category: "clothing", gender: "men", sizes: "mensClothing", name: "Hibiscus Print Resort Shirt" },
  87: { category: "clothing", gender: "men", sizes: "mensClothing", name: "Green Tartan Flannel Shirt" },
  163: { category: "clothing", gender: "women", sizes: "womensClothing", brand: "Terrace Studio", name: "Palm Print Maxi Dress" },
  164: { category: "clothing", gender: "women", sizes: "womensClothing", brand: "Terrace Studio", name: "Sage Button-Front Midi Dress" },
  165: { category: "clothing", gender: "women", sizes: "womensClothing", brand: "Terrace Studio", name: "Teal Tiered Mini Dress" },
  137: { category: "sports", brand: "Fieldcraft", name: "Leather American Football" },
  138: { category: "sports", brand: "Fieldcraft", name: "Official Size Baseball" },
  139: { category: "sports", brand: "Fieldcraft", name: "Leather Fielding Glove" },
  140: { category: "sports", brand: "Wilson", name: "Indoor/Outdoor Basketball" },
  141: { category: "sports", brand: "Fieldcraft", name: "Steel Basketball Rim and Net" },
  142: { category: "sports", brand: "Fieldcraft", name: "Red Leather Cricket Ball" },
  143: { category: "sports", brand: "SG", featured: true, name: "English Willow Cricket Bat" },
  144: { category: "sports", brand: "Masuri", name: "Cricket Batting Helmet" },
  145: { category: "sports", brand: "Fieldcraft", name: "Cricket Stumps Set" },
  146: { category: "sports", brand: "Fieldcraft", name: "Feather Shuttlecocks (Tube of 6)" },
  147: { category: "sports", brand: "Fieldcraft", name: "Classic Match Football" },
  148: { category: "sports", brand: "Titleist", name: "Pro Golf Balls (Pack of 3)" },
  149: { category: "sports", brand: "Fieldcraft", name: "7 Iron Golf Club" },
  150: { category: "sports", brand: "Fieldcraft", name: "Alloy Baseball Bat" },
  151: { category: "sports", brand: "Fieldcraft", name: "Championship Tennis Balls" },
  152: { category: "sports", brand: "Fieldcraft", name: "Graphite Tennis Racket" },
  153: { category: "sports", brand: "Fieldcraft", name: "Soft-Touch Volleyball" },
};

// DummyJSON's placeholder brand names ("Fashion Shades") become a small set of
// house and partner labels so the shelves read like a curated store.
const BRAND_MAP = {
  "Comfort Trends": "Vera Nolan",
  "Fashion Diva": "Vera Nolan",
  Pampi: "Vera Nolan",
  "Fashion Express": "Vera Nolan",
  "Fashion Timepieces": "Haldane & Co.",
  "Fashion Co.": "Haldane & Co.",
  "Fashion Gold": "Haldane & Co.",
  "Fashion Shades": "Solstice Optics",
  Fashionista: "Arlo & Pine",
  "Elegance Collection": "Arlo & Pine",
  "Urban Chic": "Arlo & Pine",
  "Fashion Trends": "Terrace Studio",
  "Classic Wear": "Terrace Studio",
  "Casual Comfort": "Terrace Studio",
};

const DETAILS = {
  footwear: (p) =>
    p.category === "womens-shoes"
      ? ["Padded footbed for longer wear", "Non-slip sole", "UK sizing; heels run true to size", p.warrantyInformation]
      : ["Cushioned footbed for all-day wear", "Grippy rubber outsole", "UK sizing; between sizes, go half a size up", p.warrantyInformation],
  watches: (p) => ["Scratch-resistant sapphire-style crystal", "Adjustable strap or bracelet, resized free in store", "Arrives in a presentation box", p.warrantyInformation],
  eyewear: (p) => ["UV400 protection against UVA and UVB", "Hard case and cleaning cloth included", "Lightweight frame with spring hinges", p.warrantyInformation],
  bags: (p) => ["Lined interior with zip pocket", `Approx. ${Math.round(p.dimensions.width)} × ${Math.round(p.dimensions.height)} × ${Math.round(p.dimensions.depth)} cm`, "Reinforced handles and base studs", p.warrantyInformation],
  clothing: () => ["Regular fit, true to size", "Breathable, easy-care fabric", "Machine wash cold, hang to dry"],
  sports: (p) => ["Built for training and match play", `Weight approx. ${p.weight} kg`, p.warrantyInformation],
};

const inr = (usd) => Math.max(199, Math.round((usd * USD_TO_INR) / 100) * 100 - 1);

// Deterministic pseudo-random numbers so re-running gives the same catalogue.
function seeded(id) {
  let x = id * 9301 + 49297;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function spreadStock(total, labels, rand) {
  if (labels.length === 1) return [{ label: labels[0], stock: total }];
  const weights = labels.map((_, i) => 1 + Math.sin(((i + 0.5) / labels.length) * Math.PI) * 2 + rand() * 0.6);
  const sum = weights.reduce((a, b) => a + b, 0);
  const sizes = labels.map((label, i) => ({ label, stock: Math.floor((weights[i] / sum) * total) }));
  // Leave the odd size sold out on low-stock products so the UI shows it.
  if (total < 20 && sizes.length > 3) sizes[0].stock = 0;
  return sizes;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function saveImage(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await sharp(buffer).resize(1000, 1000, { fit: "inside" }).webp({ quality: 82 }).toFile(path.join(IMAGE_DIR, file));
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.rm(IMAGE_DIR, { recursive: true, force: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });

  const products = [];
  for (const source of SOURCE_CATEGORIES) {
    const { products: list } = await fetchJson(`https://dummyjson.com/products/category/${source}?limit=0`);
    for (const p of list) {
      const pick = PICKS[p.id];
      if (!pick) continue;
      const rand = seeded(p.id);
      const slug = slugify(pick.name);
      const price = inr(p.price);
      const compareAtPrice = p.discountPercentage >= 12 ? inr(p.price / (1 - p.discountPercentage / 100)) : undefined;

      const images = [];
      for (const [i, url] of p.images.slice(0, 4).entries()) {
        const file = `${slug}-${i + 1}.webp`;
        await saveImage(url, file);
        images.push(file);
      }

      products.push({
        sourceId: p.id,
        name: pick.name,
        slug,
        brand: pick.brand ?? (p.category === "mens-shirts" ? "Terrace Studio" : BRAND_MAP[p.brand] ?? p.brand) ?? "Terrace Studio",
        category: pick.category,
        gender: pick.gender ?? "unisex",
        description: p.description,
        details: DETAILS[pick.category](p).filter((d) => d && d !== "No warranty"),
        price,
        compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined,
        sizes: spreadStock(p.stock, SIZE_RUNS[pick.sizes ?? "oneSize"], rand),
        sku: p.sku,
        isFeatured: Boolean(pick.featured),
        salesCount: Math.round(rand() * 240),
        ageDays: Math.round(1 + rand() * 120),
        images,
        reviews: p.reviews.map((r, i) => ({
          authorName: r.reviewerName,
          rating: r.rating,
          body: r.comment,
          daysAgo: Math.round(3 + rand() * 80 + i * 4),
        })),
      });
      process.stdout.write(".");
    }
  }

  await fs.writeFile(path.join(DATA_DIR, "catalog.json"), `${JSON.stringify({ categories: CATEGORIES, products }, null, 2)}\n`);
  console.log(`\nSaved ${products.length} products and their images.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
