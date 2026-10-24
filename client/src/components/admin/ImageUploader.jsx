import { useRef, useState } from "react";
import { ImagePlus, ArrowLeft, ArrowRight, Star, X } from "lucide-react";
import { api, assetUrl } from "../../lib/api.js";
import styles from "./ImageUploader.module.css";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 8;

// Uploads go to the API, which checks the session and admin role, decodes and
// re-encodes each file and stores it in Cloudinary. The browser never holds
// any storage credentials. Checks here only save a round trip.
export function ImageUploader({ images, onChange, error }) {
  const [pending, setPending] = useState([]);
  const [problems, setProblems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  async function handleFiles(fileList) {
    const files = [...fileList];
    const issues = [];
    const room = MAX_IMAGES - images.length - pending.length;
    const accepted = [];

    for (const file of files) {
      if (!ACCEPT.includes(file.type)) issues.push(`${file.name}: use JPG, PNG, WebP or AVIF.`);
      else if (file.size > MAX_BYTES) issues.push(`${file.name}: larger than 5 MB.`);
      else if (accepted.length >= room) issues.push(`${file.name}: a product can have up to ${MAX_IMAGES} images.`);
      else accepted.push(file);
    }
    setProblems(issues);
    if (!accepted.length) return;

    const batch = accepted.map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, preview: URL.createObjectURL(file), name: file.name }));
    setPending((list) => [...list, ...batch]);

    const form = new FormData();
    accepted.forEach((file) => form.append("images", file));
    try {
      const { images: uploaded } = await api.post("/admin/uploads", form);
      onChange([...imagesRef.current, ...uploaded.map((img) => ({ ...img, alt: "" }))]);
    } catch (err) {
      setProblems((list) => [...list, err.message]);
    } finally {
      setPending((list) => list.filter((p) => !batch.some((b) => b.id === p.id)));
      batch.forEach((b) => URL.revokeObjectURL(b.preview));
    }
  }

  function move(index, delta) {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  const update = (index, patch) => onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));

  return (
    <div className={styles.uploader}>
      <div
        className={styles.drop}
        data-dragging={dragging ? "" : undefined}
        data-invalid={error ? "" : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus size={26} aria-hidden />
        <p>
          <button type="button" onClick={() => inputRef.current?.click()}>
            Choose images
          </button>{" "}
          or drag them here
        </p>
        <p className={styles.hint}>JPG, PNG, WebP or AVIF, up to 5 MB each and at least 300 × 300 px. The first image is the cover.</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {(problems.length > 0 || error) && (
        <ul className={styles.problems} role="alert">
          {error && <li>{error}</li>}
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      {(images.length > 0 || pending.length > 0) && (
        <ul className={styles.grid}>
          {images.map((image, i) => (
            <li key={image.publicId} className={styles.tile}>
              <div className={styles.preview}>
                <img src={assetUrl(image.url)} alt={image.alt || `Product image ${i + 1}`} />
                {i === 0 && <span className={styles.cover}>Cover</span>}
                <div className={styles.tools}>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left" title="Move left">
                    <ArrowLeft size={14} />
                  </button>
                  {i !== 0 && (
                    <button type="button" onClick={() => move(i, -i)} aria-label="Make cover image" title="Make cover">
                      <Star size={14} />
                    </button>
                  )}
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move right" title="Move right">
                    <ArrowRight size={14} />
                  </button>
                  <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label="Remove image" title="Remove" data-danger>
                    <X size={14} />
                  </button>
                </div>
              </div>
              <input
                className={styles.alt}
                placeholder="Alt text, e.g. back view"
                value={image.alt ?? ""}
                maxLength={140}
                onChange={(e) => update(i, { alt: e.target.value })}
                aria-label={`Alt text for image ${i + 1}`}
              />
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className={styles.tile} aria-busy>
              <div className={styles.preview} data-pending>
                <img src={p.preview} alt="" />
                <span className={styles.spinner} aria-label={`Uploading ${p.name}`} />
              </div>
              <p className={styles.uploading}>Uploading…</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
