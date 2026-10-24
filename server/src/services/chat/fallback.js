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
  { name: "bag", test: (t) => has(t, ["my bag", "my cart", "cart", "bag me", "bag mein", "basket"]) },
  { name: "returns", test: (t) => has(t, ["return", "exchange", "refund", "wapas", "vapas", "replace"]) },
  { name: "shipping", test: (t) => has(t, ["ship", "deliver", "delivery", "dispatch", "courier", "kitne din", "how long"]) },
  { name: "payment", test: (t) => has(t, ["cod", "cash on", "payment", "pay ", "upi", "card", "emi"]) },
  { name: "sizing", test: (t) => has(t, ["size", "sizing", "fit", "chest", "measure", "small", "large"]) && !has(t, ["in size", "size m ", "size l "]) },
  { name: "care", test: (t) => has(t, ["wash", "care", "iron", "dry"]) },
  { name: "contact", test: (t) => has(t, ["contact", "email", "phone", "call", "support", "human", "agent"]) },
  { name: "about", test: (t) => has(t, ["who are you", "about terrace", "original", "licensed", "official", "authentic", "fake"]) },
];

const CATEGORY_WORDS = {
  cricket: ["cricket", "odi", "t20", "ipl"],
  basketball: ["basketball", "hoops", "nba", "vest"],
  retro: ["retro", "vintage", "classic", "old school", "90s", "80s", "throwback"],
  international: ["international", "national", "country", "world cup", "india"],
  training: ["training", "warm up", "warmup", "gym", "drill", "track top"],
  "club-football": ["club", "football", "soccer"],
};

const COLOURS = ["red", "blue", "sky", "navy", "black", "white", "green", "yellow", "gold", "orange", "purple", "maroon", "claret", "pink", "grey", "teal", "cream"];

function parseBudget(text) {
  const t = text.toLowerCase().replace(/,/g, "");
  const under = t.match(/(?:under|below|less than|within|upto|up to|max|budget|<)\s*(?:rs\.?|₹|inr)?\s*(\d{3,6})/) ?? t.match(/(\d{3,6})\s*(?:se kam|tak|ke andar|or less|max)/);
  const over = t.match(/(?:over|above|more than|>)\s*(?:rs\.?|₹|inr)?\s*(\d{3,6})/);
  return { max: under ? Number(under[1]) : undefined, min: over ? Number(over[1]) : undefined };
}

function wantsSale(text) {
  return has(text, ["sale", "discount", "offer", "deal", "cheap", "sasta", "saste"]);
}

function searchCatalog(text, products, categories) {
  const t = text.toLowerCase();
  const { min, max } = parseBudget(t);

  const categorySlugs = Object.entries(CATEGORY_WORDS)
    .filter(([slug, words]) => has(t, words) && categories.some((c) => c.slug === slug))
    .map(([slug]) => slug);
  const colours = COLOURS.filter((c) => has(t, [c]));
  const kitType = ["home", "away", "third"].find((k) => has(t, [k]));
  const size = t.match(/\b(?:size\s*)?(xxl|xl|xs|s|m|l)\b(?=\s*(size|$|\?|,|\.))/i)?.[1]?.toUpperCase();
  const tokens = t
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const scored = products
    .filter((p) => p.stock > 0)
    .filter((p) => (max === undefined || p.price <= max) && (min === undefined || p.price >= min))
    .filter((p) => !categorySlugs.length || categorySlugs.includes(p.category?.slug))
    .filter((p) => !kitType || p.kitType === kitType)
    .filter((p) => !size || sizesInStock(p).includes(size))
    .filter((p) => !wantsSale(t) || p.compareAtPrice > p.price)
    .map((p) => {
      const haystack = `${p.name} ${p.team} ${p.description} ${p.details.join(" ")}`.toLowerCase();
      let score = 0;
      for (const colour of colours) if (haystack.includes(colour)) score += 3;
      for (const token of tokens) if (haystack.includes(token)) score += 1;
      if (colours.length && !colours.some((c) => haystack.includes(c))) score -= 5;
      score += Math.min(p.salesCount ?? 0, 200) / 200;
      return { product: p, score };
    })
    .filter(({ score }) => !colours.length || score > 0)
    .sort((a, b) => b.score - a.score);

  const isSearch = Boolean(
    categorySlugs.length || colours.length || kitType || max !== undefined || min !== undefined || wantsSale(t) ||
      has(t, ["shirt", "jersey", "kit", "recommend", "suggest", "show", "looking for", "chahiye", "dikhao", "gift", "best", "popular", "new"]),
  );

  return { isSearch, results: scored.slice(0, 4).map((s) => s.product), filters: { min, max, categorySlugs, colours, kitType, size } };
}

const STOP_WORDS = new Set(
  "the and for with show me some want need looking any have what which shirt shirts jersey jerseys kit kits under below above over price rupees please can you get good best recommend suggest chahiye dikhao koi mujhe mere liye hai kya size".split(" "),
);

function describeProduct(p) {
  const sizes = sizesInStock(p);
  const sale = p.compareAtPrice > p.price ? `, down from ${rupees(p.compareAtPrice)}` : "";
  return `${p.name} is ${rupees(p.price)}${sale}. ${sizes.length ? `In stock in ${sizes.join(", ")}.` : "It's sold out right now."}`;
}

export function fallbackReply({ messages, catalog, shopper, product }) {
  const text = messages.at(-1).content;
  const intent = INTENTS.find((i) => i.test(text))?.name;
  const h = huff(text);

  // Questions about the shirt the shopper is looking at.
  if (product && (has(text, ["this", "it ", "yeh", "ye ", "iska", "isme", "stock", "available", "price", "kitne ka"]) || (intent === "sizing" && !has(text, ["chart", "guide"])))) {
    const sizes = sizesInStock(product);
    const sizeAsked = text.match(/\b(xxl|xl|xs|s|m|l)\b/i)?.[1]?.toUpperCase();
    let reply = `${h} ${describeProduct(product)}`;
    if (sizeAsked) {
      const entry = product.sizes.find((s) => s.label === sizeAsked);
      reply = entry?.stock
        ? `${h} Yes, ${sizeAsked} is in stock${entry.stock <= 5 ? ` — only ${entry.stock} left, so don't dawdle` : ""}.`
        : `${h} ${sizeAsked} is sold out on this one. ${sizes.length ? `Still have ${sizes.join(", ")}.` : ""}`;
    }
    if (intent === "sizing" && !sizeAsked) reply += ` Fit guide: ${STORE_POLICIES.sizing}`;
    return { reply, productSlugs: [], suggestions: ["Delivery time?", "Return policy?", "Show similar shirts"] };
  }

  const { isSearch, results, filters } = searchCatalog(text, catalog.products, catalog.categories);

  if (intent === "greeting") {
    const name = shopper ? ` ${shopper.firstName}` : "";
    return {
      reply: `${h} Hi${name}. I'm Chotu. I know every shirt on these rails, what's in stock, delivery and returns. What are you after?`,
      productSlugs: [],
      suggestions: ["Retro shirts under ₹2,500", "What's on sale?", "Help me pick a size"],
    };
  }
  if (intent === "thanks") {
    return { reply: "Hmph. You're welcome. Go on, the shirts won't buy themselves.", productSlugs: [], suggestions: ["What's new?", "What's on sale?"] };
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
      packed: "is packed and leaves the studio shortly",
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
    if (!shopper.bag) return { reply: `${h} Your bag is empty. Tragic. Want some suggestions?`, productSlugs: [], suggestions: ["What's popular?", "Shirts under ₹2,000"] };
    const gap = shopper.bag.amountToFreeShipping;
    return {
      reply: `${h} In your bag: ${shopper.bag.lines.join("; ")}. Subtotal ${rupees(shopper.bag.subtotal)}. ${gap > 0 ? `Add ${rupees(gap)} more for free shipping.` : "Shipping is free on this one."}`,
      productSlugs: [],
      suggestions: ["Delivery time?", "Cash on delivery?"],
    };
  }

  const policyIntent = { returns: "returns", shipping: "shipping", payment: "payment", sizing: "sizing", care: "care", contact: "contact", about: "about" }[intent];
  if (policyIntent && !(isSearch && results.length && policyIntent === "sizing")) {
    return { reply: `${h} ${STORE_POLICIES[policyIntent]}`, productSlugs: [], suggestions: FOLLOW_UPS[policyIntent] };
  }

  if (isSearch) {
    if (!results.length) {
      const budget = filters.max ? ` under ${rupees(filters.max)}` : "";
      return {
        reply: `${h} Nothing in stock matches that${budget}. Loosen it a bit — different colour, size or budget — and I'll look again.`,
        productSlugs: [],
        suggestions: ["Show bestsellers", "What's on sale?", "Retro shirts"],
      };
    }
    const lead = results.length === 1 ? "Just the one that fits:" : `Here are ${results.length} that fit.`;
    const cheapest = results.reduce((a, b) => (a.price <= b.price ? a : b));
    return {
      reply: `${h} ${lead} ${results.length > 1 ? `Cheapest is ${cheapest.name} at ${rupees(cheapest.price)}.` : describeProduct(results[0])}`,
      productSlugs: results.map((p) => p.slug),
      suggestions: ["Help me pick a size", "Delivery time?", "Anything on sale?"],
    };
  }

  return {
    reply: "Hmph. That's outside my kit room. Ask me about shirts, sizes, stock, delivery, returns or your order.",
    productSlugs: [],
    suggestions: ["What's on sale?", "Help me pick a size", "Return policy?"],
  };
}

const FOLLOW_UPS = {
  returns: ["How do refunds work for COD?", "Delivery time?"],
  shipping: ["Cash on delivery?", "Return policy?"],
  payment: ["Free shipping?", "Delivery time?"],
  sizing: ["Do retro shirts run big?", "Return policy?"],
  care: ["Return policy?", "What's new?"],
  contact: ["Return policy?", "Delivery time?"],
  about: ["What's popular?", "Retro shirts"],
};
