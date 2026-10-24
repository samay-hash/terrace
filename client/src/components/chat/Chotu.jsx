import styles from "./Chotu.module.css";

// Chotu, the shop-floor attendant: small, permanently annoyed, very helpful.
// `mood` changes the face: idle (grumpy), thinking (steam), talking, pleased.
export function Chotu({ mood = "idle", size = 48, withBackground = true, className = "" }) {
  const browL = mood === "pleased" ? "M40,57 L54,59" : "M40,55 L54,61";
  const browR = mood === "pleased" ? "M80,52 L66,56" : "M80,55 L66,61";
  const eyeY = mood === "thinking" ? 63.5 : 66;
  const eyeShiftX = mood === "thinking" ? 2 : 0;

  return (
    <svg
      className={`${styles.chotu} ${className}`}
      data-mood={mood}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Chotu, the Terrace assistant"
    >
      {withBackground && <circle cx="60" cy="60" r="60" fill="var(--tint-sand)" />}
      <defs>
        <clipPath id="chotu-clip">
          <circle cx="60" cy="60" r="60" />
        </clipPath>
      </defs>
      <g clipPath={withBackground ? "url(#chotu-clip)" : undefined}>
        {/* shirt */}
        <path d="M12,124 C16,98 36,88 60,88 C84,88 104,98 108,124 Z" fill="#2B4A3F" />
        <path d="M46,89 L60,103 L74,89" fill="none" stroke="var(--brass)" strokeWidth="4.5" strokeLinejoin="round" />
        <rect x="52" y="78" width="16" height="12" rx="4" fill="#D9A47C" />
        {/* head */}
        <circle cx="30" cy="58" r="6.5" fill="#E9B48A" />
        <circle cx="90" cy="58" r="6.5" fill="#E9B48A" />
        <circle cx="60" cy="56" r="30" fill="#F0BE95" />
        <path d="M33,66 C38,84 82,84 87,66 C84,80 72,87 60,87 C48,87 36,80 33,66 Z" fill="#E2A97E" opacity="0.7" />
        {/* hair and headband */}
        <path
          d="M32,46 C31,27 46,19 60,19 C75,19 90,27 88,46 C82,38 74,36 68,37 C70,30 65,27 61,32 C57,27 50,29 52,36 C44,35 37,39 32,46 Z"
          fill="#2A1F1A"
        />
        <path d="M30.5,45 C44,39 76,39 89.5,45 L89.5,51 C76,45.5 44,45.5 30.5,51 Z" fill="var(--brass)" />
        <path d="M55,44 L58.5,40.5 L62,44" fill="none" stroke="#F4F3EF" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        {/* brows */}
        <g className={styles.brows}>
          <path d={browL} stroke="#2A1F1A" strokeWidth="4.6" strokeLinecap="round" />
          <path d={browR} stroke="#2A1F1A" strokeWidth="4.6" strokeLinecap="round" />
        </g>
        {/* eyes */}
        <g className={styles.eyes} transform={`translate(${eyeShiftX} 0)`}>
          <circle cx="47" cy={eyeY} r="3.7" fill="#1B1512" />
          <circle cx="73" cy={eyeY} r="3.7" fill="#1B1512" />
          <circle cx="48.3" cy={eyeY - 1.3} r="1.15" fill="#fff" />
          <circle cx="74.3" cy={eyeY - 1.3} r="1.15" fill="#fff" />
        </g>
        {/* cheeks */}
        <ellipse cx="39" cy="73" rx="5.5" ry="3.2" fill="#E8857A" opacity="0.45" />
        <ellipse cx="81" cy="73" rx="5.5" ry="3.2" fill="#E8857A" opacity="0.45" />
        {/* mouth */}
        {mood === "talking" ? (
          <ellipse className={styles.talk} cx="60" cy="78.5" rx="4.2" ry="3.2" fill="#5A2E27" />
        ) : mood === "pleased" ? (
          <path d="M53,78 Q61,81 68,75.5" fill="none" stroke="#5A2E27" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path d="M53,79.5 Q60,75 67,79.5" fill="none" stroke="#5A2E27" strokeWidth="3" strokeLinecap="round" />
        )}
      </g>
      {/* steam, only while thinking */}
      <g className={styles.steam} aria-hidden>
        <circle cx="94" cy="26" r="5" fill="#F4F3EF" />
        <circle cx="101" cy="18" r="3.6" fill="#F4F3EF" />
        <circle cx="24" cy="24" r="4.2" fill="#F4F3EF" />
      </g>
    </svg>
  );
}
