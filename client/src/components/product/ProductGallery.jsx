import { useRef, useState } from "react";
import { assetUrl } from "../../lib/api.js";
import styles from "./ProductGallery.module.css";

// Thumbnails + main image. On devices with a mouse, hovering the main image
// zooms in and follows the pointer; on touch screens the images become a
// swipeable strip with dots.
export function ProductGallery({ images, name }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(null);
  const stripRef = useRef(null);
  const current = images[index] ?? images[0];

  if (!images.length) return <div className={styles.main} aria-label="No image available" />;

  function onMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setZoom({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  }

  return (
    <div className={styles.gallery}>
      {images.length > 1 && (
        <div className={styles.thumbs} role="tablist" aria-label="Product images">
          {images.map((image, i) => (
            <button
              key={image.publicId ?? image.url}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image ${i + 1}${image.alt ? `: ${image.alt}` : ""}`}
              className={styles.thumb}
              onClick={() => setIndex(i)}
              onMouseEnter={() => setIndex(i)}
            >
              <img className="product-photo" src={assetUrl(image.url)} alt="" width="96" height="96" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div
        className={`${styles.main} photo-scope`}
        role="tabpanel"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
        data-zoom={zoom ? "" : undefined}
      >
        <img
          key={current.url}
          src={assetUrl(current.url)}
          alt={current.alt || name}
          width="1000"
          height="1000"
          className={`${styles.image} product-photo`}
          style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
        <span className={styles.hint} aria-hidden>
          Hover to zoom
        </span>
      </div>

      {/* Touch layout */}
      <div className={styles.mobile}>
        <div
          ref={stripRef}
          className={`${styles.strip} no-scrollbar`}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {images.map((image, i) => (
            <div key={image.publicId ?? image.url} className={styles.slide}>
              <img className="product-photo" src={assetUrl(image.url)} alt={i === 0 ? image.alt || name : ""} width="800" height="800" loading={i === 0 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className={styles.dots}>
            {images.map((image, i) => (
              <button
                key={image.publicId ?? image.url}
                type="button"
                aria-label={`Image ${i + 1}`}
                aria-current={i === index || undefined}
                onClick={() => stripRef.current?.scrollTo({ left: i * stripRef.current.clientWidth, behavior: "smooth" })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
