import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { SizeTable } from "../components/product/SizeTable.jsx";
import { Button } from "../components/ui/Button.jsx";
import styles from "./Help.module.css";

const SECTIONS = [
  { id: "shipping", title: "Shipping and delivery" },
  { id: "returns", title: "Returns and exchanges" },
  { id: "sizing", title: "Size guide" },
  { id: "care", title: "Product care" },
  { id: "contact", title: "Contact us" },
];

export default function Help() {
  useDocumentTitle("Help");
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={`display ${styles.title}`}>Help</h1>
        <p>Everything about delivery, returns, sizes and care. Still stuck? Chotu answers in seconds, a person by email within a day.</p>
      </header>

      <div className={styles.layout}>
        <nav className={styles.toc} aria-label="On this page">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </nav>

        <div className={styles.content}>
          <section id="shipping" aria-labelledby="shipping-h">
            <h2 id="shipping-h">Shipping and delivery</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Cost</dt>
                <dd>Free on orders of ₹2,999 or more. Otherwise a flat ₹99.</dd>
              </div>
              <div>
                <dt>Dispatch</dt>
                <dd>Orders placed before 2 pm, Monday to Saturday, leave our store the same day.</dd>
              </div>
              <div>
                <dt>Delivery time</dt>
                <dd>3–5 business days to metro cities, up to 8 business days elsewhere in India.</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>Cash on delivery everywhere we ship. Pay in cash or by UPI to the courier.</dd>
              </div>
            </dl>
          </section>

          <section id="returns" aria-labelledby="returns-h">
            <h2 id="returns-h">Returns and exchanges</h2>
            <p>
              Return or exchange anything within 30 days of delivery, free of charge, as long as it's unused, in its original packaging
              and still has its tags. Watches need their protective film intact. Start from your <Link to="/account">order page</Link>{" "}
              or email us with your order number.
            </p>
            <p>
              Refunds for cash-on-delivery orders go to your bank account within 5 business days of the item reaching us. Size
              exchanges ship as soon as the return is scanned by the courier.
            </p>
          </section>

          <section id="sizing" aria-labelledby="sizing-h">
            <h2 id="sizing-h">Size guide</h2>
            <p>Shoes use UK sizes. Clothing is a regular fit. Watches, sunglasses, bags and sports gear are one size.</p>
            <h3 className={styles.subhead}>Shoes</h3>
            <SizeTable kind="shoes" />
            <h3 className={styles.subhead}>Clothing</h3>
            <SizeTable kind="clothing" />
          </section>

          <section id="care" aria-labelledby="care-h">
            <h2 id="care-h">Product care</h2>
            <p>
              Wipe leather shoes and bags with a soft dry cloth and keep them out of direct sun. Keep watches away from magnets and have
              them serviced every few years. Store sunglasses in their case. Wash clothing inside out at 30°C and hang to dry.
            </p>
          </section>

          <section id="contact" aria-labelledby="contact-h">
            <h2 id="contact-h">Contact us</h2>
            <p>
              Email <a href="mailto:care@terracekits.in">care@terracekits.in</a> or call <a href="tel:+918040002626">+91 80 4000 2626</a>,
              Monday to Saturday, 10 am to 7 pm IST.
            </p>
            <Button variant="dark" onClick={() => window.dispatchEvent(new CustomEvent("chotu:open"))}>
              Ask Chotu now
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
