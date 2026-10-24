import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, Lock } from "lucide-react";
import { api } from "../lib/api.js";
import { assetUrl } from "../lib/api.js";
import { formatPrice } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { SummaryRows } from "../components/cart/CartSummary.jsx";
import { Button } from "../components/ui/Button.jsx";
import { TextInput, Select } from "../components/ui/Field.jsx";
import { Notice, PageLoader } from "../components/ui/Feedback.jsx";
import styles from "./Checkout.module.css";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Chandigarh", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep",
];

function validate(values) {
  const errors = {};
  if (values.fullName.trim().length < 2) errors.fullName = "Enter the name for delivery.";
  if (!/^[6-9]\d{9}$/.test(values.phone.trim())) errors.phone = "Enter a 10-digit Indian mobile number.";
  if (values.line1.trim().length < 4) errors.line1 = "Enter a house number and street.";
  if (values.city.trim().length < 2) errors.city = "Enter a city.";
  if (!values.state) errors.state = "Choose a state.";
  if (!/^[1-9]\d{5}$/.test(values.postalCode.trim())) errors.postalCode = "Enter a 6-digit PIN code.";
  return errors;
}

export default function Checkout() {
  useDocumentTitle("Checkout");
  const { user } = useAuth();
  const { cart, isLoading, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState({ fullName: user?.name ?? "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <PageLoader />;
  if (!cart.items.length && !submitting) return <Navigate to="/cart" replace />;

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((x) => ({ ...x, [field]: undefined }));
  };

  async function onSubmit(event) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const { order } = await api.post("/orders", { shippingAddress: values, paymentMethod: "cod" });
      queryClient.setQueryData(["orders", order.id], order);
      queryClient.invalidateQueries({ queryKey: ["orders", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      await refresh();
      toast.success("Order placed. We'll text you when it ships.");
      navigate(`/orders/${order.id}?placed=1`, { replace: true });
    } catch (error) {
      setSubmitting(false);
      const fields = Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k.replace("shippingAddress.", ""), v]));
      setErrors(fields);
      setFormError(error.message);
      if (error.code === "CART_CHANGED" || error.code === "OUT_OF_STOCK") refresh();
    }
  }

  const blocked = cart.items.some((i) => i.issue && i.issue !== "limited");

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={`display ${styles.title}`}>Checkout</h1>
      <ol className={styles.steps} aria-label="Checkout steps">
        <li data-done>Bag</li>
        <li aria-current="step">Delivery and payment</li>
        <li>Confirmation</li>
      </ol>

      <form className={styles.layout} onSubmit={onSubmit} noValidate>
        <div className={styles.form}>
          <section className={styles.block} aria-labelledby="address-title">
            <h2 id="address-title">Delivery address</h2>
            <div className={styles.grid}>
              <TextInput label="Full name" autoComplete="name" value={values.fullName} onChange={set("fullName")} error={errors.fullName} className={styles.span2} />
              <TextInput label="Mobile number" autoComplete="tel-national" inputMode="numeric" prefix="+91" maxLength={10} value={values.phone} onChange={set("phone")} error={errors.phone} hint="For delivery updates only." className={styles.span2} />
              <TextInput label="House number and street" autoComplete="address-line1" value={values.line1} onChange={set("line1")} error={errors.line1} className={styles.span2} />
              <TextInput label="Area or landmark" optional autoComplete="address-line2" value={values.line2} onChange={set("line2")} error={errors.line2} className={styles.span2} />
              <TextInput label="City" autoComplete="address-level2" value={values.city} onChange={set("city")} error={errors.city} />
              <TextInput label="PIN code" autoComplete="postal-code" inputMode="numeric" maxLength={6} value={values.postalCode} onChange={set("postalCode")} error={errors.postalCode} />
              <Select label="State" autoComplete="address-level1" value={values.state} onChange={set("state")} error={errors.state} className={styles.span2}>
                <option value="">Choose a state</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          <section className={styles.block} aria-labelledby="payment-title">
            <h2 id="payment-title">Payment</h2>
            <label className={styles.payment}>
              <input type="radio" name="payment" checked readOnly />
              <Banknote size={22} aria-hidden />
              <span>
                <strong>Cash on delivery</strong>
                <span>Pay in cash or by UPI when your order arrives.</span>
              </span>
            </label>
            <p className={styles.muted}>Online card and UPI payments are coming soon.</p>
          </section>
        </div>

        <aside className={styles.summary} aria-label="Order summary">
          <h2>Your order</h2>
          <ul className={styles.items}>
            {cart.items.map((item) => (
              <li key={item.id ?? `${item.productId}:${item.size}`}>
                <span className={styles.thumb}>
                  <img src={assetUrl(item.image)} alt="" width="64" height="80" />
                  <span className={styles.qty}>{item.quantity}</span>
                </span>
                <span className={styles.itemText}>
                  <span>{item.name}</span>
                  <span className={styles.muted}>Size {item.size}</span>
                </span>
                <span className="tabular">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <SummaryRows summary={cart.summary} />
          {formError && <Notice tone="error">{formError}</Notice>}
          {blocked && <Notice tone="error">Some items are unavailable. Go back to your bag to remove them.</Notice>}
          <Button type="submit" size="lg" block loading={submitting} disabled={blocked}>
            Place order, {formatPrice(cart.summary.total)}
          </Button>
          <p className={styles.secure}>
            <Lock size={14} aria-hidden /> Prices and stock are checked again on our side before the order is confirmed.
          </p>
        </aside>
      </form>
    </div>
  );
}
