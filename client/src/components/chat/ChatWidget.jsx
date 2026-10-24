import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUp, RotateCcw, X } from "lucide-react";
import { api, assetUrl } from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import { readJSON, writeJSON } from "../../lib/storage.js";
import { Chotu } from "./Chotu.jsx";
import styles from "./ChatWidget.module.css";

const HISTORY_KEY = "terrace.chotu";
const NUDGE_KEY = "terrace.chotu.nudged";
const MAX_LENGTH = 1200;

const WELCOME = {
  role: "assistant",
  local: true,
  content: "Hmph. You found me. I'm Chotu. I know every shirt here, what's in stock, sizes, delivery and returns. Ask. Quickly.",
  suggestions: ["Retro shirts under ₹2,500", "What's on sale?", "Help me pick a size"],
};

// The API expects alternating turns ending with the shopper; drop local-only
// messages and merge any back-to-back turns left over from a failed request.
function toApiHistory(messages) {
  const history = [];
  for (const m of messages) {
    if (m.local || m.error) continue;
    const last = history.at(-1);
    if (last && last.role === m.role) last.content = `${last.content}\n${m.content}`.slice(0, MAX_LENGTH);
    else history.push({ role: m.role, content: m.content });
  }
  while (history.length && history[0].role !== "user") history.shift();
  return history.slice(-12);
}

function ProductStrip({ products, onNavigate }) {
  if (!products?.length) return null;
  return (
    <ul className={styles.products}>
      {products.map((p) => (
        <li key={p.id}>
          <Link to={`/product/${p.slug}`} className={styles.product} onClick={onNavigate}>
            <img src={assetUrl(p.image)} alt="" width="120" height="150" loading="lazy" />
            <span className={styles.productName}>{p.name}</span>
            <span className={`${styles.productPrice} tabular`}>
              {formatPrice(p.price)}
              {p.compareAtPrice > p.price && <s>{formatPrice(p.compareAtPrice)}</s>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => readJSON(HISTORY_KEY, [WELCOME], window.sessionStorage));
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [nudge, setNudge] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const productSlug = location.pathname.startsWith("/product/") ? location.pathname.split("/")[2] : undefined;
  const hidden = location.pathname.startsWith("/admin");

  useEffect(() => writeJSON(HISTORY_KEY, messages.slice(-30), window.sessionStorage), [messages]);

  // Other parts of the page (e.g. "Ask Chotu" buttons) open the chat this way.
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("chotu:open", openChat);
    return () => window.removeEventListener("chotu:open", openChat);
  }, []);

  useEffect(() => {
    if (readJSON(NUDGE_KEY, false)) return undefined;
    const id = setTimeout(() => setNudge(true), 6000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setNudge(false);
      writeJSON(NUDGE_KEY, true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text) {
    const content = text.trim().slice(0, MAX_LENGTH);
    if (!content || pending) return;
    const next = [...messages.filter((m) => !m.error), { role: "user", content }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const reply = await api.post("/chat", { messages: toApiHistory(next), productSlug });
      setMessages((list) => [...list, { role: "assistant", content: reply.reply, products: reply.products, suggestions: reply.suggestions }]);
    } catch (error) {
      setMessages((list) => [...list, { role: "assistant", error: true, content: error.message, retry: content }]);
    } finally {
      setPending(false);
    }
  }

  function retry(content) {
    setMessages((list) => {
      const trimmed = list.filter((m) => !m.error);
      // Remove the user message that failed; send() adds it back.
      if (trimmed.at(-1)?.role === "user" && trimmed.at(-1).content === content) trimmed.pop();
      return trimmed;
    });
    setTimeout(() => send(content), 0);
  }

  if (hidden) return null;

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && !m.error);
  const mood = pending ? "thinking" : "idle";

  return (
    <div className={styles.root}>
      {open && (
        <section className={styles.panel} role="dialog" aria-label="Chat with Chotu" aria-modal="false">
          <header className={styles.head}>
            <Chotu mood={mood} size={44} />
            <div className={styles.headText}>
              <h2>Chotu</h2>
              <p>{pending ? "Muttering, looking it up…" : "Kit-room assistant. Grumpy, but quick."}</p>
            </div>
            <button
              type="button"
              className={styles.headButton}
              onClick={() => setMessages([WELCOME])}
              aria-label="Start a new conversation"
              title="Start over"
            >
              <RotateCcw size={17} />
            </button>
            <button type="button" className={styles.headButton} onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={19} />
            </button>
          </header>

          <div className={styles.list} ref={listRef} aria-live="polite">
            {productSlug && (
              <p className={styles.context}>Ask about the shirt you're viewing: stock, sizing or delivery.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={styles.message} data-role={m.role} data-error={m.error ? "" : undefined}>
                {m.role === "assistant" && <Chotu size={26} className={styles.mini} />}
                <div className={styles.bubbleWrap}>
                  <p className={styles.bubble}>{m.content}</p>
                  {m.error && (
                    <button type="button" className={styles.retry} onClick={() => retry(m.retry)}>
                      Try again
                    </button>
                  )}
                  <ProductStrip products={m.products} onNavigate={() => window.innerWidth < 640 && setOpen(false)} />
                  {m === lastAssistant && !pending && m.suggestions?.length > 0 && (
                    <div className={styles.suggestions}>
                      {m.suggestions.map((s) => (
                        <button key={s} type="button" onClick={() => send(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {pending && (
              <div className={styles.message} data-role="assistant">
                <Chotu size={26} mood="thinking" className={styles.mini} />
                <p className={`${styles.bubble} ${styles.typing}`} aria-label="Chotu is typing">
                  <span />
                  <span />
                  <span />
                </p>
              </div>
            )}
          </div>

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="chotu-input" className="visually-hidden">
              Message Chotu
            </label>
            <textarea
              id="chotu-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={MAX_LENGTH}
              placeholder="Ask about sizes, stock, delivery…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button type="submit" className={styles.send} disabled={!input.trim() || pending} aria-label="Send message">
              <ArrowUp size={18} />
            </button>
          </form>
        </section>
      )}

      {!open && nudge && (
        <div className={styles.nudge}>
          <p>Size doubts? Ask me. Quickly.</p>
          <button
            type="button"
            onClick={() => {
              setNudge(false);
              writeJSON(NUDGE_KEY, true);
            }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close chat with Chotu" : "Chat with Chotu, the shopping assistant"}
      >
        {open ? <X size={24} /> : <Chotu size={60} mood={nudge ? "pleased" : "idle"} />}
      </button>
    </div>
  );
}
