import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { api } from "../../lib/api.js";
import { useCategories } from "../../hooks/queries.js";
import { Logo } from "./Logo.jsx";
import styles from "./Footer.module.css";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function onSubmit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setState({ status: "error", message: "Enter a valid email address." });
      return;
    }
    setState({ status: "loading", message: "" });
    try {
      const res = await api.post("/newsletter", { email: email.trim() });
      setState({ status: "done", message: res.message });
      setEmail("");
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form className={styles.newsletter} onSubmit={onSubmit} noValidate>
      <label htmlFor="newsletter-email" className={styles.newsTitle}>
        New arrivals and restocks, once a fortnight.
      </label>
      <div className={styles.newsField}>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={state.status === "error" || undefined}
          aria-describedby="newsletter-status"
        />
        <button type="submit" disabled={state.status === "loading"} aria-label="Subscribe">
          <ArrowRight size={18} />
        </button>
      </div>
      <p id="newsletter-status" className={styles.newsStatus} data-status={state.status} role="status">
        {state.message || "No spam. Unsubscribe from any email."}
      </p>
    </form>
  );
}

export function Footer() {
  const { data: categories = [] } = useCategories();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <Logo tone="light" />
          <p>An independent sport and street store from Bengaluru. Fewer things, chosen well, delivered fast.</p>
          <Newsletter />
        </div>

        <nav className={styles.col} aria-label="Shop">
          <h2>Shop</h2>
          <Link to="/shop">Everything</Link>
          {categories.map((c) => (
            <Link key={c.id} to={`/shop?category=${c.slug}`}>
              {c.name}
            </Link>
          ))}
          <Link to="/shop?onSale=true">Sale</Link>
        </nav>

        <nav className={styles.col} aria-label="Help">
          <h2>Help</h2>
          <Link to="/help#shipping">Shipping and delivery</Link>
          <Link to="/help#returns">Returns and exchanges</Link>
          <Link to="/help#sizing">Size guide</Link>
          <Link to="/help#care">Product care</Link>
          <Link to="/help#contact">Contact us</Link>
        </nav>

        <div className={styles.col}>
          <h2>Visit or write</h2>
          <p className={styles.contactLine}>
            <MapPin size={15} aria-hidden /> 12th Main, Indiranagar, Bengaluru 560038
          </p>
          <a className={styles.contactLine} href="mailto:care@terracekits.in">
            <Mail size={15} aria-hidden /> care@terracekits.in
          </a>
          <a className={styles.contactLine} href="tel:+918040002626">
            <Phone size={15} aria-hidden /> +91 80 4000 2626
          </a>
          <p className={styles.hours}>Mon–Sat, 10 am – 7 pm</p>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} Terrace Goods.</p>
        <p className={styles.demo}>
          Demo store built for a hiring assignment; nothing is shipped or charged. Product data from DummyJSON.{" "}
          <Link to="/help#credits">Photo credits</Link>
        </p>
      </div>
    </footer>
  );
}
