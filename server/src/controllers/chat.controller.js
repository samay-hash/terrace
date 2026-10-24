import { config } from "../config/env.js";
import { askClaude } from "../services/chat/claude.js";
import { fallbackReply } from "../services/chat/fallback.js";
import { getCatalog, getShopperContext, toCard } from "../services/chat/knowledge.js";

const MAX_CARDS = 4;
const MAX_SUGGESTIONS = 3;

export async function chat(req, res) {
  const { messages, productSlug } = req.valid.body;
  const [catalog, shopper] = await Promise.all([getCatalog(), getShopperContext(req.user)]);
  const product = productSlug ? catalog.products.find((p) => p.slug === productSlug) : undefined;
  const input = { messages, catalog, shopper, product };

  let answer;
  let source = "rules";
  if (config.chatModelEnabled) {
    try {
      answer = await askClaude(input);
      source = "model";
    } catch (error) {
      // Any model failure (network, rate limit, bad output) degrades to the
      // rule-based assistant instead of an error bubble.
      console.warn("Chat model unavailable, using rules:", error?.status ?? "", error?.message);
    }
  }
  answer ??= fallbackReply(input);

  // Only slugs that exist in the live catalogue become cards.
  const bySlug = new Map(catalog.products.map((p) => [p.slug, p]));
  const products = [...new Set(answer.productSlugs)]
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, MAX_CARDS)
    .map(toCard);

  res.json({
    reply: answer.reply,
    products,
    suggestions: answer.suggestions.map((s) => s.slice(0, 60)).slice(0, MAX_SUGGESTIONS),
    source,
  });
}
