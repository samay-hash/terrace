import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useCategories } from "../../hooks/queries.js";
import { Logo } from "./Logo.jsx";
import styles from "./Footer.module.css";

export function Footer() {
  const { data: categories = [] } = useCategories();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <Logo tone="light" />
          <p>
            An independent kit studio from Bengaluru. Original shirts and faithful retro tributes, with our own crests and honest
            prices.
          </p>
          <ul className={styles.contact}>
            <li>
              <Mail size={16} aria-hidden /> <a href="mailto:care@terracekits.in">care@terracekits.in</a>
            </li>
            <li>
              <Phone size={16} aria-hidden /> <a href="tel:+918040002626">+91 80 4000 2626</a>
            </li>
            <li>
              <MapPin size={16} aria-hidden /> Indiranagar, Bengaluru 560038
            </li>
          </ul>
        </div>

        <nav className={styles.col} aria-label="Shop">
          <h2>Shop</h2>
          <Link to="/shop">All shirts</Link>
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
          <Link to="/help#care">Caring for your shirt</Link>
          <Link to="/help#contact">Contact us</Link>
        </nav>

        <nav className={styles.col} aria-label="Account">
          <h2>Account</h2>
          <Link to="/account">My orders</Link>
          <Link to="/cart">Bag</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/signup">Create an account</Link>
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} Terrace Kit Studio.</p>
        <p className={styles.demo}>
          Demo store built for a hiring assignment. Clubs, sponsors and orders are fictional; nothing is shipped or charged.
        </p>
      </div>

      <div className={styles.wordmark} aria-hidden>
        Terrace
      </div>
    </footer>
  );
}
