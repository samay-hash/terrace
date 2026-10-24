import { useState } from "react";
import { assetUrl } from "../../lib/api.js";
import styles from "./ProductGallery.module.css";

export function ProductGallery({ images, name }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  if (!images.length) return <div className={styles.main} aria-label="No image available" />;

  return (
    <div className={styles.gallery}>
      <div className={styles.thumbs} role="tablist" aria-label="Product images">
        {images.map((image, i) => (
          <button
            key={image.publicId ?? image.url}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show image ${i + 1}: ${image.alt || name}`}
            className={styles.thumb}
            onClick={() => setIndex(i)}
          >
            <img src={assetUrl(image.url)} alt="" width="96" height="120" loading="lazy" />
          </button>
        ))}
      </div>
      <div className={styles.main} role="tabpanel">
        <img key={current.url} src={assetUrl(current.url)} alt={current.alt || name} width="1200" height="1500" className={styles.image} />
      </div>
    </div>
  );
}
