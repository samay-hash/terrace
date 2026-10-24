import { useEffect, useState } from "react";
import { Truck, RotateCcw } from "lucide-react";
import styles from "./DeliveryEstimate.module.css";

const CUTOFF_HOUR = 14;
const dateFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });

function addBusinessDays(date, days) {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added += 1; // the courier doesn't deliver on Sundays
  }
  return d;
}

// Works out the same promise the help page makes: orders before 2 pm on a
// weekday (Mon–Sat) leave the same day, then 3–5 business days to metros.
export function estimate(now = new Date()) {
  const dispatchesToday = now.getDay() !== 0 && now.getHours() < CUTOFF_HOUR;
  const dispatch = dispatchesToday ? now : addBusinessDays(now, 1);
  const cutoff = new Date(now);
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0);
  const minutesLeft = Math.max(0, Math.round((cutoff - now) / 60000));
  return { dispatchesToday, minutesLeft, from: addBusinessDays(dispatch, 3), to: addBusinessDays(dispatch, 5) };
}

export function DeliveryEstimate({ freeShipping }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const e = estimate(now);
  const left = e.minutesLeft >= 60 ? `${Math.floor(e.minutesLeft / 60)} h ${e.minutesLeft % 60} min` : `${e.minutesLeft} min`;

  return (
    <div className={styles.box}>
      <p className={styles.row}>
        <Truck size={18} strokeWidth={1.7} aria-hidden />
        <span>
          Arrives <strong>{dateFormat.format(e.from)} – {dateFormat.format(e.to)}</strong> to metro cities.{" "}
          {e.dispatchesToday ? `Order within ${left} for same-day dispatch.` : "Ships next working day."}
          {freeShipping ? " Free shipping on this item." : " Free shipping over ₹2,999."}
        </span>
      </p>
      <p className={styles.row}>
        <RotateCcw size={18} strokeWidth={1.7} aria-hidden />
        <span>Free returns and exchanges within 30 days. Cash on delivery available.</span>
      </p>
    </div>
  );
}
