import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Star } from "lucide-react";
import { api } from "../../lib/api.js";
import { formatDate } from "../../lib/format.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useProductReviews } from "../../hooks/queries.js";
import { Rating } from "../ui/Controls.jsx";
import { Button } from "../ui/Button.jsx";
import { Select, TextArea, TextInput } from "../ui/Field.jsx";
import { Notice, Skeleton } from "../ui/Feedback.jsx";
import styles from "./Reviews.module.css";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function StarInput({ value, onChange, error }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className={styles.starInput} aria-describedby={error ? "rating-error" : undefined}>
      <legend>Your rating</legend>
      <div onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} onMouseEnter={() => setHover(n)}>
            <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} />
            <Star size={26} strokeWidth={1.5} fill={n <= shown ? "currentColor" : "none"} aria-hidden />
            <span className="visually-hidden">
              {n} star{n > 1 ? "s" : ""}, {LABELS[n]}
            </span>
          </label>
        ))}
        <span className={styles.starLabel}>{LABELS[shown]}</span>
      </div>
      {error && (
        <p id="rating-error" className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

function ReviewForm({ slug, onDone }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState({ rating: 0, title: "", body: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const found = {};
    if (!values.rating) found.rating = "Choose a star rating.";
    if (values.body.trim().length < 10) found.body = "Write at least 10 characters.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await api.post(`/products/${slug}/reviews`, values);
      toast.success("Thanks, your review is live.");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
      onDone();
    } catch (error) {
      setErrors({ ...error.fields, form: Object.keys(error.fields).length ? "" : error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {errors.form && <Notice tone="error">{errors.form}</Notice>}
      <StarInput value={values.rating} onChange={(rating) => setValues((v) => ({ ...v, rating }))} error={errors.rating} />
      <TextInput label="Headline" optional maxLength={80} value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} error={errors.title} />
      <TextArea
        label="Your review"
        rows={4}
        maxLength={1000}
        value={values.body}
        onChange={(e) => setValues((v) => ({ ...v, body: e.target.value }))}
        error={errors.body}
        hint="How's the fit, quality and finish? Reviews are public and show your first name."
      />
      <div className={styles.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Post review
        </Button>
      </div>
    </form>
  );
}

export function Reviews({ slug }) {
  const { user } = useAuth();
  const location = useLocation();
  const [sort, setSort] = useState("newest");
  const [limit, setLimit] = useState(5);
  const [writing, setWriting] = useState(false);
  const { data, isLoading, isFetching } = useProductReviews(slug, { sort, limit });

  if (isLoading) return <Skeleton height={240} radius="var(--radius-lg)" />;
  if (!data) return null;

  const { summary, items, pagination, mine } = data;
  const max = Math.max(1, ...summary.breakdown.map((b) => b.count));

  return (
    <div className={styles.reviews}>
      <aside className={styles.summary}>
        <p className={`display ${styles.average}`}>{summary.count ? summary.average.toFixed(1) : "–"}</p>
        {summary.count > 0 ? <Rating value={summary.average} count={summary.count} size={16} showValue={false} /> : null}
        <p className={styles.muted}>{summary.count ? `Based on ${summary.count} review${summary.count === 1 ? "" : "s"}` : "No reviews yet"}</p>
        <ul className={styles.bars}>
          {summary.breakdown.map((b) => (
            <li key={b.star}>
              <span>{b.star}★</span>
              <span className={styles.bar}>
                <span style={{ width: `${(b.count / max) * 100}%` }} />
              </span>
              <span className="tabular">{b.count}</span>
            </li>
          ))}
        </ul>
        {mine ? (
          <Notice tone="ok">You reviewed this product on {formatDate(mine.createdAt)}.</Notice>
        ) : user ? (
          !writing && (
            <Button variant="secondary" block onClick={() => setWriting(true)}>
              Write a review
            </Button>
          )
        ) : (
          <Button variant="secondary" block to={`/login?next=${encodeURIComponent(location.pathname)}`}>
            Sign in to write a review
          </Button>
        )}
      </aside>

      <div className={styles.list}>
        {writing && <ReviewForm slug={slug} onDone={() => setWriting(false)} />}

        {items.length > 0 && (
          <div className={styles.listHead}>
            <p className={styles.muted}>
              Showing {items.length} of {pagination.total}
            </p>
            <Select className={styles.sort} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort reviews">
              <option value="newest">Newest first</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </Select>
          </div>
        )}

        <ul style={{ opacity: isFetching ? 0.6 : 1 }}>
          {items.map((r) => (
            <li key={r.id} className={styles.review}>
              <div className={styles.reviewTop}>
                <Rating value={r.rating} count={1} size={13} showValue={false} />
                <span className={styles.muted}>{formatDate(r.createdAt)}</span>
              </div>
              {r.title && <p className={styles.reviewTitle}>{r.title}</p>}
              <p className={styles.reviewBody}>{r.body}</p>
              <p className={styles.reviewAuthor}>
                {r.authorName.split(" ")[0]}
                {r.verified && (
                  <span>
                    <BadgeCheck size={14} aria-hidden /> Verified buyer
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>

        {!items.length && !writing && <p className={styles.empty}>Be the first to review this product.</p>}

        {pagination.total > items.length && (
          <Button variant="secondary" onClick={() => setLimit((l) => l + 5)} loading={isFetching}>
            Show more reviews
          </Button>
        )}
        {!user && items.length > 0 && (
          <p className={styles.muted}>
            Bought this? <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>Sign in</Link> to share how it's working out.
          </p>
        )}
      </div>
    </div>
  );
}
