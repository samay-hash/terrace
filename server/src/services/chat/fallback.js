import { STORE_POLICIES, sizesInStock } from "./knowledge.js";

// Rule-based Chotu, used when no ANTHROPIC_API_KEY is configured or the model
// call fails. It understands the common shopper questions (in English and
// everyday Hinglish) and searches the live catalogue, so the assistant is
// always useful even without the language model.

const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;

const HUFFS = ["Hmph.", "Fine.", "Ugh, okay.", "Right.", "Hmm."];
function huff(seed) {
  return HUFFS[seed.length % HUFFS.length];
}

const has = (text, words) => words.some((w) => new RegExp(`(^|[^a-z])${w}`, "i").test(text));

const INTENTS = [
  { name: "greeting", test: (t) => /^(hi+|hey+|hello+|namaste|yo|hola|sup|good (morning|evening|afternoon))\b/i.test(t.trim()) },
  { name: "thanks", test: (t) => has(t, ["thank", "thx", "shukriya", "dhanyavad"]) },
  { name: "order", test: (t) => has(t, ["order", "track", "where is my", "kab aayega", "kab aaega", "status"]) },
  { name: "bag", test: (t) => has(t, ["my bag", "my cart", "cart", "bag me", "bag mein", "basket"]) && !has(t, ["handbag", "backpack", "tote"]) },
  { name: "returns", test: (t) => has(t, ["return", "exchange", "refund", "wapas", "vapas", "replace"]) },
  { name: "shipping", test: (t) => has(t, ["ship", "deliver", "delivery", "dispatch", "courier", "kitne din", "how long"]) },
  { name: "payment", test: (t) => has(t, ["cod", "cash on", "payment", "pay ", "upi", "card", "emi"]) },
  { name: "sizing", test: (t) => has(t, ["size", "sizing", "fit", "chest", "measure", "foot length", "uk "]) && !/\b(in|size)\s+(uk\s*)?\d/i.test(t) },
  { name: "care", test: (t) => has(t, ["wash", "care", "clean", "polish"]) },
  { name: "contact", test: (t) => has(t, ["contact", "email", "phone", "call", "support", "human", "agent"]) },
  { name: "about", test: (t) => has(t, ["who are you", "about terrace", "original", "genuine", "authentic", "fake"]) },
];

const CATEGORY_WORDS = {
  footwear: ["shoe", "sneaker", "trainer", "jordan", "heel", "stiletto", "sandal", "cleat", "footwear", "joota", "jootey"],
  watches: ["watch", "rolex", "timepiece", "ghadi", "chronograph"],
  eyewear: ["sunglass", "shades", "aviator", "glasses", "eyewear", "chashma"],
  bags: ["bag", "handbag", "backpack", "tote", "satchel", "purse"],
  clothing: ["shirt", "dress", "clothing", "clothes", "kapde", "top", "plaid", "check"],
  sports: ["sport", "cricket", "football", "tennis", "basketball", "golf", "baseball", "volleyball", "badminton", "shuttle", "bat", "ball", "racket", "helmet"],
};

const COLOURS = ["red", "blue", "navy", "black", "white", "green", "yellow", "gold", "brown", "silver", "pink", "grey", "gray", "teal", "tan", "rose"];

function parseBudget(text) {
  const t = text.toLowerCase().replace(/,/g, "");
  const under =
    t.match(/(?:under|below|less than|within|upto|up to|max|budget|<)\s*(?:rs\.?|₹|inr)?\s*(\d{3,7})/) ??
    t.match(/(\d{3,7})\s*(?:se kam|tak|ke andar|or less|max)/);
  const over = t.match(/(?:over|above|more than|>)\s*(?:rs\.?|₹|inr)?\s*(\d{3,7})/);
  return { max: under ? Number(under[1]) : undefined, min: over ? Number(over[1]) : undefined };
}

function wantsSale(text) {
  return has(text, ["sale", "discount", "offer", "deal", "cheap", "sasta", "saste"]);
}

function wantsGender(text) {
  if (/\bher\b/i.test(text) || has(text, ["women", "woman", "ladies", "girlfriend", "wife", "mom", "mother", "sister"])) return "women";
  if (/\b(him|men|man|mens)\b/i.test(text) || has(text, ["boyfriend", "husband", "dad", "father", "brother"])) return "men";
  return undefined;
}

// Words shoppers use interchangeably for the same kind of product.
const SYNONYMS = [
  ["trainer", "sneaker", "jordan", "cleat"],
  ["heel", "stiletto", "pump", "sandal"],
  ["bag", "tote", "satchel", "handbag", "backpack", "hobo"],
  ["sunglass", "aviator", "shades", "clubmaster"],
];
function expand(token) {
  const group = SYNONYMS.find((g) => g.some((w) => token.startsWith(w)));
  return group ?? [token.replace(/s$/, "")];
}

const STOP_WORDS = new Set(
  "the and for with show me some want need looking any have what which under below above over price rupees please can you get good best recommend suggest chahiye dikhao koi mujhe mere liye hai kya size gift something".split(" "),
);

function searchCatalog(text, products, categories) {
  const t = text.toLowerCase();
  const { min, max } = parseBudget(t);

  const categorySlugs = Object.entries(CATEGORY_WORDS)
    .filter(([slug, words]) => has(t, words) && categories.some((c) => c.slug === slug))
    .map(([slug]) => slug);
  const colours = COLOURS.filter((c) => has(t, [c]));
  const gender = wantsGender(t);
  const ukSize = t.match(/\buk\s*(\d{1,2})\b/)?.[1];
  const size = ukSize ? `UK ${ukSize}` : t.match(/\bsize\s*(xxl|xl|xs|s|m|l)\b/i)?.[1]?.toUpperCase();
  const tokens = t
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const scored = products
    .filter((p) => p.stock > 0)
    .filter((p) => (max === undefined || p.price <= max) && (min === undefined || p.price >= min))
    .filter((p) => !categorySlugs.length || categorySlugs.includes(p.category?.slug))
    .filter((p) => !gender || p.gender === gender || p.gender === "unisex")
    // "Something for her" means personal items, not a tube of shuttlecocks.
    .filter((p) => !gender || categorySlugs.length || p.category?.slug !== "sports")
    .filter((p) => !size || sizesInStock(p).includes(size))
    .filter((p) => !wantsSale(t) || p.compareAtPrice > p.price)
    .map((p) => {
      const name = `${p.name} ${p.brand}`.toLowerCase();
      const haystack = `${name} ${p.description} ${p.details.join(" ")}`.toLowerCase();
      let score = 0;
      for (const colour of colours) if (haystack.includes(colour)) score += 3;
      // Words in the product name count for more than words in its description.
      let hits = 0;
      for (const token of tokens) {
        const words = expand(token);
        if (words.some((w) => name.includes(w))) {
          score += 3;
          hits += 1;
        } else if (words.some((w) => haystack.includes(w))) {
          score += 1;
          hits += 1;
        }
      }
      if (p.brand && t.includes(p.brand.toLowerCase())) score += 4;
      if (gender && p.gender === gender) score += 3;
      if (colours.length && !colours.some((c) => haystack.includes(c))) score -= 5;
      score += (p.rating ?? 0) / 10 + Math.min(p.salesCount ?? 0, 200) / 800;
      return { product: p, score, hits };
    })
    .filter(({ score }) => !colours.length || score > 0)
    .sort((a, b) => b.score - a.score);

  // If some products match the words used, drop the ones that match none.
  const matched = scored.some((s) => s.hits > 0) ? scored.filter((s) => s.hits > 0) : scored;

  const isSearch = Boolean(
    categorySlugs.length || colours.length || gender || size || max !== undefined || min !== undefined || wantsSale(t) ||
      has(t, ["recommend", "suggest", "show", "looking for", "chahiye", "dikhao", "gift", "best", "popular", "new", "top rated"]) ||
      products.some((p) => p.brand && t.includes(p.brand.toLowerCase())),
  );

  return { isSearch, results: matched.slice(0, 4).map((s) => s.product), filters: { min, max } };
}

function describeProduct(p) {
  const sizes = sizesInStock(p);
  const sale = p.compareAtPrice > p.price ? `, down from ${rupees(p.compareAtPrice)}` : "";
  const stock = !sizes.length ? "It's sold out right now." : sizes.length === 1 && sizes[0] === "One size" ? "In stock." : `In stock in ${sizes.join(", ")}.`;
  return `${p.name} is ${rupees(p.price)}${sale}. ${stock}`;
}

const FOLLOW_UPS = {
  returns: ["How do refunds work for COD?", "Delivery time?"],
  shipping: ["Cash on delivery?", "Return policy?"],
  payment: ["Free shipping?", "Delivery time?"],
  sizing: ["Do trainers run small?", "Return policy?"],
  care: ["Return policy?", "What's new?"],
  contact: ["Return policy?", "Delivery time?"],
  about: ["What's popular?", "Top rated watches"],
};

export function fallbackReply({ messages, catalog, shopper, product }) {
  const text = messages.at(-1).content;
  const intent = INTENTS.find((i) => i.test(text))?.name;
  const h = huff(text);

  // Questions about the product the shopper is looking at.
  const aboutThis = has(text, ["this", "it ", "yeh", "ye ", "iska", "isme", "stock", "available", "price", "kitne ka", "uk "]) || intent === "sizing";
  if (product && aboutThis) {
    const sizes = sizesInStock(product);
    const asked = text.match(/\buk\s*(\d{1,2})\b/i)?.[1] ? `UK ${text.match(/\buk\s*(\d{1,2})\b/i)[1]}` : text.match(/\b(xxl|xl|xs|s|m|l)\b/i)?.[1]?.toUpperCase();
    let reply = `${h} ${describeProduct(product)}`;
    if (asked) {
      const entry = product.sizes.find((s) => s.label.toLowerCase() === asked.toLowerCase());
      reply = entry?.stock
        ? `${h} Yes, ${asked} is in stock${entry.stock <= 5 ? `. Only ${entry.stock} left, so don't dawdle` : ""}.`
        : `${h} ${asked} isn't available on this one. ${sizes.length ? `Still have ${sizes.join(", ")}.` : ""}`;
    }
    if (intent === "sizing" && !asked) reply += ` Fit guide: ${STORE_POLICIES.sizing}`;
    return { reply, productSlugs: [], suggestions: ["Delivery time?", "Return policy?", "Show similar items"] };
  }

  const { isSearch, results, filters } = searchCatalog(text, catalog.products, catalog.categories);

  if (intent === "greeting") {
    const name = shopper ? ` ${shopper.firstName}` : "";
    return {
      reply: `${h} Hi${name}. I'm Chotu. I know everything on these shelves: stock, sizes, delivery and returns. What are you after?`,
      productSlugs: [],
      suggestions: ["Trainers under ₹10,000", "What's on sale?", "Gift ideas for him"],
    };
  }
  if (intent === "thanks") {
    return { reply: "Hmph. You're welcome. Go on, the bag won't fill itself.", productSlugs: [], suggestions: ["What's new?", "What's on sale?"] };
  }

  if (intent === "order") {
    if (!shopper) {
      return { reply: `${h} Sign in and I can tell you exactly where your order is. Or check "My orders" in your account.`, productSlugs: [], suggestions: ["Delivery time?", "Return policy?"] };
    }
    if (!shopper.orders.length) {
      return { reply: `${h} You haven't placed any orders yet, ${shopper.firstName}. Your bag is waiting.`, productSlugs: [], suggestions: ["What's popular?", "What's on sale?"] };
    }
    const [latest, ...rest] = shopper.orders;
    const statusLine = {
      placed: "is placed and waiting to be packed",
      packed: "is packed and leaves our store shortly",
      shipped: "has shipped and is on its way",
      delivered: "was delivered",
      cancelled: "was cancelled",
    }[latest.status];
    return {
      reply: `${h} Order ${latest.number} (${rupees(latest.total)}, placed ${latest.placedOn}) ${statusLine}.${rest.length ? ` You have ${rest.length} older order${rest.length > 1 ? "s" : ""} in your account.` : ""}`,
      productSlugs: [],
      suggestions: ["Return policy?", "How long is delivery?"],
    };
  }

  if (intent === "bag") {
    if (!shopper) return { reply: `${h} Your bag lives in this browser until you sign in. Open it from the bag icon up top.`, productSlugs: [], suggestions: ["Free shipping?", "What's on sale?"] };
    if (!shopper.bag) return { reply: `${h} Your bag is empty. Tragic. Want some suggestions?`, productSlugs: [], suggestions: ["What's popular?", "Sunglasses under ₹3,000"] };
    const gap = shopper.bag.amountToFreeShipping;
    return {
      reply: `${h} In your bag: ${shopper.bag.lines.join("; ")}. Subtotal ${rupees(shopper.bag.subtotal)}. ${gap > 0 ? `Add ${rupees(gap)} more for free shipping.` : "Shipping is free on this one."}`,
      productSlugs: [],
      suggestions: ["Delivery time?", "Cash on delivery?"],
    };
  }

  const policy = { returns: "returns", shipping: "shipping", payment: "payment", sizing: "sizing", care: "care", contact: "contact", about: "about" }[intent];
  if (policy && !(isSearch && results.length && policy === "sizing")) {
    return { reply: `${h} ${STORE_POLICIES[policy]}`, productSlugs: [], suggestions: FOLLOW_UPS[policy] };
  }

  if (isSearch) {
    if (!results.length) {
      const budget = filters.max ? ` under ${rupees(filters.max)}` : "";
      return {
        reply: `${h} Nothing in stock matches that${budget}. Loosen it a bit (colour, size or budget) and I'll look again.`,
        productSlugs: [],
        suggestions: ["Show bestsellers", "What's on sale?", "Top rated watches"],
      };
    }
    const cheapest = results.reduce((a, b) => (a.price <= b.price ? a : b));
    const lead = results.length === 1 ? describeProduct(results[0]) : `Here are ${results.length} that fit. Cheapest is ${cheapest.name} at ${rupees(cheapest.price)}.`;
    return {
      reply: `${h} ${lead}`,
      productSlugs: results.map((p) => p.slug),
      suggestions: ["Help me pick a size", "Delivery time?", "Anything on sale?"],
    };
  }

  return {
    reply: "Hmph. That's outside my shop floor. Ask me about products, sizes, stock, delivery, returns or your order.",
    productSlugs: [],
    suggestions: ["What's on sale?", "Help me pick a size", "Return policy?"],
  };
}
