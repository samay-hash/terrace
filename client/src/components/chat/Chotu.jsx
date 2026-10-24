import styles from "./Chotu.module.css";

// Flat polar bear for browsers without WebGL; the 3D bear is in teddyScene.js.
// `mood` changes the face: idle, thinking (eyes up), talking, pleased.
export function Chotu({ mood = "idle", size = 48, withBackground = true, className = "" }) {
  const eyeY = mood === "thinking" ? 55.5 : 58;
  const eyeShiftX = mood === "thinking" ? 1.5 : 0;

  return (
    <svg
      className={`${styles.chotu} ${className}`}
      data-mood={mood}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="The Terrace assistant"
    >
      {withBackground && <circle cx="60" cy="60" r="60" fill="var(--tint-sand)" />}
      <defs>
        <clipPath id="bear-clip">
          <circle cx="60" cy="60" r="60" />
        </clipPath>
        <radialGradient id="bear-fur" cx="45%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ece6dc" />
        </radialGradient>
      </defs>
      <g clipPath={withBackground ? "url(#bear-clip)" : undefined}>
        {/* body and scarf */}
        <ellipse cx="60" cy="118" rx="40" ry="28" fill="url(#bear-fur)" />
        <path d="M28,92 C40,100 80,100 92,92 L94,101 C80,110 40,110 26,101 Z" fill="#2B4A3F" />
        <circle cx="75" cy="101" r="3" fill="none" stroke="var(--brass)" strokeWidth="1.6" />
        {/* ears */}
        <circle cx="35" cy="35" r="12" fill="url(#bear-fur)" />
        <circle cx="85" cy="35" r="12" fill="url(#bear-fur)" />
        <circle cx="35.5" cy="36" r="6" fill="#ead6cf" />
        <circle cx="84.5" cy="36" r="6" fill="#ead6cf" />
        {/* head */}
        <ellipse cx="60" cy="60" rx="34" ry="31" fill="url(#bear-fur)" stroke="rgba(60,40,20,0.08)" strokeWidth="1" />
        <ellipse cx="60" cy="72" rx="15" ry="11" fill="#fffdf9" />
        {/* eyes */}
        <g className={styles.eyes} transform={`translate(${eyeShiftX} 0)`}>
          <circle cx="47" cy={eyeY} r="3.6" fill="#1B1714" />
          <circle cx="73" cy={eyeY} r="3.6" fill="#1B1714" />
          <circle cx="48.2" cy={eyeY - 1.3} r="1.1" fill="#fff" />
          <circle cx="74.2" cy={eyeY - 1.3} r="1.1" fill="#fff" />
        </g>
        {/* cheeks */}
        <ellipse cx="39" cy="68" rx="5.5" ry="3.2" fill="#F0A8A0" opacity="0.5" />
        <ellipse cx="81" cy="68" rx="5.5" ry="3.2" fill="#F0A8A0" opacity="0.5" />
        {/* nose and mouth */}
        <ellipse cx="60" cy="66.5" rx="5.6" ry="4" fill="#1B1714" />
        {mood === "talking" ? (
          <ellipse className={styles.talk} cx="60" cy="76" rx="3.4" ry="2.8" fill="#5A2E27" />
        ) : mood === "pleased" ? (
          <path d="M54,73.5 Q60,79 66,73.5" fill="none" stroke="#3A2A22" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M55,73.5 Q57.5,76.5 60,73.5 Q62.5,76.5 65,73.5" fill="none" stroke="#3A2A22" strokeWidth="2" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}
