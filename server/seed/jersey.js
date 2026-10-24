// Parametric SVG renderer for the seed catalogue's product photography.
// Each kit is described by colours and a pattern; the renderer draws a front,
// back and close-up "studio shot" on a consistent backdrop, so the demo store
// has a coherent set of product images without licensing anyone's photos.

const W = 1000;
const H = 1250;
const BACKDROP = "#ECEAE6";
const DISPLAY = "Big Shoulders Display";

// ---------- colour helpers ----------
function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}
function shade(hex, amount) {
  // amount < 0 darkens, > 0 lightens
  const rgb = hexToRgb(hex);
  return rgbToHex(rgb.map((v) => (amount < 0 ? v * (1 + amount) : v + (255 - v) * amount)));
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------- silhouettes ----------
const TEE = {
  bodyFront:
    "M422,232 C385,248 335,258 292,272 Q300,380 322,470 L330,760 Q336,900 326,1050 Q500,1074 674,1050 Q664,900 670,760 L678,470 Q700,380 708,272 C665,258 615,248 578,232 C560,292 440,292 422,232 Z",
  bodyBack:
    "M422,232 C385,248 335,258 292,272 Q300,380 322,470 L330,760 Q336,900 326,1050 Q500,1074 674,1050 Q664,900 670,760 L678,470 Q700,380 708,272 C665,258 615,248 578,232 Q500,252 422,232 Z",
  polo:
    "M422,232 C385,248 335,258 292,272 Q300,380 322,470 L330,760 Q336,900 326,1050 Q500,1074 674,1050 Q664,900 670,760 L678,470 Q700,380 708,272 C665,258 615,248 578,232 Q540,262 500,264 Q460,262 422,232 Z",
  sleeveL: "M292,272 C240,300 190,380 150,478 L240,556 Q285,515 322,470 Q300,380 292,272 Z",
  sleeveR: "M708,272 C760,300 810,380 850,478 L760,556 Q715,515 678,470 Q700,380 708,272 Z",
  cuffL: "M150,478 L240,556 L254,537 L164,459 Z",
  cuffR: "M850,478 L760,556 L746,537 L836,459 Z",
  innerNeck: "M422,232 Q500,210 578,232 C560,292 440,292 422,232 Z",
  innerNeckV: "M422,232 Q500,210 578,232 L500,334 Z",
  frontNeck: "M422,232 C440,292 560,292 578,232",
  vNeck: "M422,232 L500,334 L578,232",
  backNeck: "M422,232 Q500,252 578,232",
  backCollarInside: "M422,232 Q500,212 578,232",
  seams: ["M292,272 Q300,380 322,470", "M708,272 Q700,380 678,470"],
  folds: [
    { d: "M330,520 C380,610 400,700 380,840", dark: true },
    { d: "M670,540 C620,640 610,740 640,880", dark: true },
    { d: "M450,600 C470,720 460,860 430,1000", dark: false },
    { d: "M560,330 C600,420 600,500 580,600", dark: false },
  ],
  sides: { left: [322, 470, 330, 1050], right: [678, 470, 670, 1050] },
};

const VEST = {
  bodyFront:
    "M402,206 L356,208 C352,330 336,452 300,522 Q312,800 306,1056 Q500,1080 694,1056 Q688,800 700,522 C664,452 648,330 644,208 L598,206 C588,318 412,318 402,206 Z",
  bodyBack:
    "M402,206 L356,208 C352,330 336,452 300,522 Q312,800 306,1056 Q500,1080 694,1056 Q688,800 700,522 C664,452 648,330 644,208 L598,206 C580,262 420,262 402,206 Z",
  innerNeck: "M402,206 Q500,186 598,206 C588,318 412,318 402,206 Z",
  frontNeck: "M402,206 C412,318 588,318 598,206",
  backNeck: "M402,206 C420,262 580,262 598,206",
  armL: "M356,208 C352,330 336,452 300,522",
  armR: "M644,208 C648,330 664,452 700,522",
  folds: [
    { d: "M330,600 C370,700 380,820 360,960", dark: true },
    { d: "M670,600 C630,700 620,820 640,960", dark: true },
    { d: "M470,640 C490,760 480,880 450,1010", dark: false },
  ],
  sides: { left: [300, 522, 306, 1056], right: [700, 522, 694, 1056] },
};

// ---------- patterns (drawn inside the body clip) ----------
function patternLayer(spec) {
  const c = spec.secondary;
  const p = spec.pattern;
  const out = [];
  if (p === "stripes" || p === "pinstripes" || p === "centre-band") {
    if (p === "centre-band") {
      out.push(`<rect x="430" y="150" width="140" height="1000" fill="${c}"/>`);
      if (spec.tertiary) {
        out.push(`<rect x="418" y="150" width="12" height="1000" fill="${spec.tertiary}"/><rect x="570" y="150" width="12" height="1000" fill="${spec.tertiary}"/>`);
      }
    } else {
      const period = p === "pinstripes" ? spec.period ?? 34 : spec.period ?? 92;
      const width = p === "pinstripes" ? spec.lineWidth ?? 4 : period / 2;
      for (let x = 500 - width / 2 - period * 8; x < 820; x += period) {
        out.push(`<rect x="${x.toFixed(1)}" y="150" width="${width}" height="1000" fill="${c}"/>`);
      }
    }
  } else if (p === "hoops" || p === "fade-hoops") {
    const period = spec.period ?? 110;
    let i = 0;
    for (let y = 250; y < 1100; y += period, i += 1) {
      const opacity = p === "fade-hoops" ? Math.max(0, 1 - i * 0.16) : 1;
      out.push(`<rect x="100" y="${y}" width="800" height="${period / 2}" fill="${c}" fill-opacity="${opacity.toFixed(2)}"/>`);
    }
  } else if (p === "halves") {
    out.push(`<rect x="500" y="150" width="400" height="1000" fill="${c}"/>`);
  } else if (p === "quarters") {
    out.push(`<rect x="500" y="150" width="400" height="${spec.quarterSplit ?? 520}" fill="${c}"/>`);
    out.push(`<rect x="100" y="${150 + (spec.quarterSplit ?? 520)}" width="400" height="1000" fill="${c}"/>`);
  } else if (p === "sash") {
    out.push(`<polygon points="230,330 330,222 790,830 690,940" fill="${c}"/>`);
  } else if (p === "chevron") {
    out.push(`<polygon points="250,360 500,560 750,360 750,450 500,650 250,450" fill="${c}"/>`);
  } else if (p === "band") {
    out.push(`<rect x="100" y="${spec.bandY ?? 430}" width="800" height="${spec.bandHeight ?? 96}" fill="${c}"/>`);
  } else if (p === "yoke") {
    out.push(`<path d="M100,150 L900,150 L900,330 Q500,${spec.yokeDepth ?? 420} 100,330 Z" fill="${c}"/>`);
  } else if (p === "gradient") {
    out.push(`<rect x="100" y="150" width="800" height="1000" fill="url(#grad)"/>`);
  } else if (p === "diagonal") {
    const period = spec.period ?? 46;
    const lw = spec.lineWidth ?? 8;
    // Only lines that can cross the shirt; fully clipped shapes are skipped.
    for (let x = -800; x < 800; x += period) {
      out.push(`<polygon points="${x},150 ${x + lw},150 ${x + 1000 + lw},1150 ${x + 1000},1150" fill="${c}" fill-opacity="${spec.patternOpacity ?? 1}"/>`);
    }
  } else if (p === "shards") {
    // Angular graphic print for modern training tops.
    const shards = [
      "300,520 520,380 470,560", "520,380 720,300 640,520", "470,560 640,520 560,760",
      "300,720 470,560 420,820", "560,760 700,640 700,900", "330,940 420,820 520,980",
    ];
    shards.forEach((pts, i) => out.push(`<polygon points="${pts}" fill="${c}" fill-opacity="${(0.35 + (i % 3) * 0.2).toFixed(2)}"/>`));
  }
  return out.join("");
}

// ---------- marks ----------
// Terrace logomark: a stepped silhouette, like stadium terrace steps seen side-on.
export function terraceMark(x, y, size, fill) {
  const s = size / 24;
  return `<path transform="translate(${x},${y}) scale(${s})" d="M0,24 L0,17 L7,17 L7,10 L14,10 L14,3 L24,3 L24,24 Z" fill="${fill}"/>`;
}

function crest(spec, cx, cy, scale = 1) {
  const { shape = "shield", bg, fg, initials } = spec.crest;
  const t = `translate(${cx},${cy}) scale(${scale})`;
  let outline;
  if (shape === "round") outline = `<circle cx="0" cy="0" r="34" fill="${bg}" stroke="${fg}" stroke-width="4"/><circle cx="0" cy="0" r="27" fill="none" stroke="${fg}" stroke-width="1.5"/>`;
  else if (shape === "diamond") outline = `<path d="M0,-40 L34,0 L0,40 L-34,0 Z" fill="${bg}" stroke="${fg}" stroke-width="4"/>`;
  else outline = `<path d="M-30,-36 L30,-36 L30,4 C30,24 14,36 0,42 C-14,36 -30,24 -30,4 Z" fill="${bg}" stroke="${fg}" stroke-width="4"/><path d="M-30,-20 L30,-20" stroke="${fg}" stroke-width="2"/>`;
  const fontSize = initials.length > 2 ? 18 : 24;
  return `<g transform="${t}">${outline}<text x="0" y="${shape === "shield" ? 12 : 9}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="${fontSize}" fill="${fg}" letter-spacing="1">${initials}</text></g>`;
}

// ---------- full render ----------
function defs(spec, silhouette, view) {
  const body = view === "back" ? silhouette.bodyBack : view === "front" && spec.collar === "polo" && silhouette === TEE ? TEE.polo : silhouette.bodyFront;
  const shirtParts = silhouette === TEE ? `<path d="${body}"/><path d="${TEE.sleeveL}"/><path d="${TEE.sleeveR}"/>` : `<path d="${body}"/>`;
  return {
    body,
    xml: `<defs>
  <radialGradient id="bg" cx="50%" cy="38%" r="75%">
    <stop offset="0" stop-color="#F6F4F0"/><stop offset="0.65" stop-color="${BACKDROP}"/><stop offset="1" stop-color="#DEDBD5"/>
  </radialGradient>
  <radialGradient id="floor" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${spec.base}"/><stop offset="1" stop-color="${spec.secondary}"/>
  </linearGradient>
  <linearGradient id="sideShade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity="0.30"/>
    <stop offset="0.16" stop-color="#000" stop-opacity="0.06"/>
    <stop offset="0.42" stop-color="#fff" stop-opacity="0.07"/>
    <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.84" stop-color="#000" stop-opacity="0.07"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.30"/>
  </linearGradient>
  <linearGradient id="topLight" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.10"/>
    <stop offset="0.35" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.14"/>
  </linearGradient>
  <clipPath id="bodyClip"><path d="${body}"/></clipPath>
  <clipPath id="shirtClip">${shirtParts}</clipPath>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="knit" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${spec.seed ?? 3}"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.10"/></feComponentTransfer>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <pattern id="mesh" width="9" height="9" patternUnits="userSpaceOnUse">
    <circle cx="4.5" cy="4.5" r="1.3" fill="#000" fill-opacity="0.07"/>
  </pattern>
</defs>`,
  };
}

function teeLayers(spec, view, body) {
  const sleeve = spec.sleeves ?? spec.base;
  const cuff = spec.cuffs ?? spec.trim;
  const collarColor = spec.collarColor ?? spec.trim;
  const inner = shade(spec.base, -0.45);
  const parts = [];

  // Inside of the back of the shirt, visible through the neck opening.
  if (view === "front" && spec.collar !== "polo") {
    parts.push(`<path d="${spec.collar === "vneck" ? TEE.innerNeckV : TEE.innerNeck}" fill="${inner}"/>`);
  }

  parts.push(`<path d="${TEE.sleeveL}" fill="${sleeve}"/><path d="${TEE.sleeveR}" fill="${sleeve}"/>`);
  parts.push(`<path d="${TEE.cuffL}" fill="${cuff}"/><path d="${TEE.cuffR}" fill="${cuff}"/>`);
  if (spec.cuffStripe) {
    parts.push(`<path d="M168,452 L258,530" stroke="${spec.cuffStripe}" stroke-width="5"/><path d="M832,452 L742,530" stroke="${spec.cuffStripe}" stroke-width="5"/>`);
  }

  parts.push(`<path d="${body}" fill="${spec.base}"/>`);
  parts.push(`<g clip-path="url(#bodyClip)">${patternLayer(spec)}${sidePanels(spec, TEE)}${yokeOverlay(spec)}</g>`);

  // Collar
  if (view === "back") {
    parts.push(`<path d="${TEE.backNeck}" fill="none" stroke="${collarColor}" stroke-width="18" stroke-linecap="round"/>`);
  } else if (spec.collar === "vneck") {
    parts.push(`<path d="${TEE.vNeck}" fill="none" stroke="${collarColor}" stroke-width="20" stroke-linejoin="miter" stroke-linecap="round"/>`);
    parts.push(`<path d="${TEE.backCollarInside}" fill="none" stroke="${shade(collarColor, -0.25)}" stroke-width="12" stroke-linecap="round"/>`);
  } else if (spec.collar === "polo") {
    const placket = spec.placket ?? spec.base;
    parts.push(`<path d="M418,226 Q500,198 582,226" fill="none" stroke="${shade(collarColor, -0.2)}" stroke-width="22" stroke-linecap="round"/>`);
    parts.push(`<rect x="484" y="262" width="32" height="132" rx="3" fill="${placket}" stroke="${shade(spec.base, -0.3)}" stroke-width="2"/>`);
    parts.push(`<circle cx="500" cy="300" r="5" fill="${shade(placket, -0.35)}"/><circle cx="500" cy="352" r="5" fill="${shade(placket, -0.35)}"/>`);
    parts.push(`<path d="M500,266 C470,246 444,230 416,222 L388,252 C408,292 430,318 456,340 Z" fill="${collarColor}" stroke="${shade(collarColor, -0.25)}" stroke-width="2"/>`);
    parts.push(`<path d="M500,266 C530,246 556,230 584,222 L612,252 C592,292 570,318 544,340 Z" fill="${collarColor}" stroke="${shade(collarColor, -0.25)}" stroke-width="2"/>`);
    if (spec.collarStripe) {
      parts.push(`<path d="M394,256 C412,292 432,314 452,332" fill="none" stroke="${spec.collarStripe}" stroke-width="4"/><path d="M606,256 C588,292 568,314 548,332" fill="none" stroke="${spec.collarStripe}" stroke-width="4"/>`);
    }
  } else {
    parts.push(`<path d="${TEE.frontNeck}" fill="none" stroke="${collarColor}" stroke-width="20" stroke-linecap="round"/>`);
    parts.push(`<path d="${TEE.backCollarInside}" fill="none" stroke="${shade(collarColor, -0.25)}" stroke-width="12" stroke-linecap="round"/>`);
  }

  // Seams and hem stitching
  parts.push(`<path d="M330,1034 Q500,1057 670,1034" fill="none" stroke="#000" stroke-opacity="0.16" stroke-width="2" stroke-dasharray="7 5"/>`);
  for (const d of TEE.seams) parts.push(`<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2.5"/>`);
  return parts.join("");
}

function vestLayers(spec, view, body) {
  const trim = spec.collarColor ?? spec.trim;
  const parts = [];
  if (view === "front") parts.push(`<path d="${VEST.innerNeck}" fill="${shade(spec.base, -0.45)}"/>`);
  parts.push(`<path d="${body}" fill="${spec.base}"/>`);
  parts.push(`<g clip-path="url(#bodyClip)">${patternLayer(spec)}${sidePanels(spec, VEST)}</g>`);
  const neck = view === "back" ? VEST.backNeck : VEST.frontNeck;
  parts.push(`<path d="${neck}" fill="none" stroke="${trim}" stroke-width="18" stroke-linecap="round"/>`);
  parts.push(`<path d="${VEST.armL}" fill="none" stroke="${trim}" stroke-width="18" stroke-linecap="round"/><path d="${VEST.armR}" fill="none" stroke="${trim}" stroke-width="18" stroke-linecap="round"/>`);
  if (spec.trimStripe) {
    parts.push(`<path d="${neck}" fill="none" stroke="${spec.trimStripe}" stroke-width="4" transform="translate(0,12)"/>`);
  }
  // hem stripe
  parts.push(`<path d="M306,1040 Q500,1064 694,1040" fill="none" stroke="${trim}" stroke-width="12"/>`);
  return parts.join("");
}

function sidePanels(spec, silhouette) {
  if (!spec.sidePanels) return "";
  const { left, right } = silhouette.sides;
  return `<polygon points="${left[0] - 30},${left[1]} ${left[0] + 34},${left[1]} ${left[2] + 34},${left[3] + 40} ${left[2] - 30},${left[3] + 40}" fill="${spec.sidePanels}"/>
<polygon points="${right[0] + 30},${right[1]} ${right[0] - 34},${right[1]} ${right[2] - 34},${right[3] + 40} ${right[2] + 30},${right[3] + 40}" fill="${spec.sidePanels}"/>`;
}

function yokeOverlay(spec) {
  if (!spec.shoulderYoke) return "";
  return `<path d="M100,150 L900,150 L900,300 Q500,370 100,300 Z" fill="${spec.shoulderYoke}"/>`;
}

function shading(silhouette) {
  const folds = silhouette.folds
    .map((f) => `<path d="${f.d}" fill="none" stroke="${f.dark ? "#000" : "#fff"}" stroke-opacity="${f.dark ? 0.16 : 0.13}" stroke-width="${f.dark ? 22 : 18}" stroke-linecap="round" filter="url(#soft)"/>`)
    .join("");
  return `<g clip-path="url(#shirtClip)">
  <rect width="${W}" height="${H}" fill="url(#mesh)"/>
  <rect width="${W}" height="${H}" fill="#808080" filter="url(#knit)"/>
  <rect width="${W}" height="${H}" fill="url(#sideShade)"/>
  <rect width="${W}" height="${H}" fill="url(#topLight)"/>
  ${folds}
</g>`;
}

function frontPrint(spec, silhouette) {
  const parts = [];
  const markColor = spec.markColor ?? spec.trim;
  if (silhouette === VEST) {
    // Basketball: wordmark across the chest and a front number.
    const ink = spec.numberColor ?? spec.trim;
    const word = spec.wordmark ?? spec.crest.initials;
    const wordSize = word.length > 8 ? 58 : word.length > 6 ? 66 : 78;
    parts.push(`<text x="500" y="478" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="${wordSize}" letter-spacing="3" fill="${ink}">${word}</text>`);
    parts.push(`<text x="500" y="690" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="200" fill="${ink}" stroke="${spec.numberOutline ?? "none"}" stroke-width="5">${spec.number ?? "23"}</text>`);
    parts.push(terraceMark(540, 352, 26, markColor));
    return parts.join("");
  }
  parts.push(crest(spec, 590, 398));
  parts.push(terraceMark(392, 382, 30, markColor));
  if (spec.sponsor) {
    const size = spec.sponsor.size ?? (spec.sponsor.text.length > 10 ? 52 : 66);
    parts.push(`<text x="500" y="${spec.sponsor.y ?? 590}" text-anchor="middle" font-family="${spec.sponsor.font ?? DISPLAY}" font-weight="${spec.sponsor.weight ?? 800}" font-size="${size}" letter-spacing="${spec.sponsor.spacing ?? 4}" fill="${spec.sponsor.color}">${spec.sponsor.text}</text>`);
  }
  return parts.join("");
}

function backPrint(spec, silhouette) {
  const ink = spec.numberColor ?? (luminance(spec.base) > 0.45 ? "#15171A" : "#FFFFFF");
  const outline = spec.numberOutline ? `stroke="${spec.numberOutline}" stroke-width="6" paint-order="stroke"` : "";
  const nameY = silhouette === VEST ? 420 : 430;
  const numberY = silhouette === VEST ? 760 : 790;
  return `${terraceMark(488, silhouette === VEST ? 236 : 262, 24, spec.markColor ?? spec.trim)}
<text x="500" y="${nameY}" text-anchor="middle" font-family="${DISPLAY}" font-weight="800" font-size="58" letter-spacing="6" fill="${ink}" ${outline}>${spec.printName}</text>
<text x="500" y="${numberY}" text-anchor="middle" font-family="${DISPLAY}" font-weight="900" font-size="330" fill="${ink}" ${outline}>${spec.number}</text>`;
}

export function renderJersey(spec, view = "front") {
  const silhouette = spec.silhouette === "vest" ? VEST : TEE;
  const side = view === "back" ? "back" : "front";
  const { body, xml } = defs(spec, silhouette, side);
  const layers = silhouette === TEE ? teeLayers(spec, side, body) : vestLayers(spec, side, body);
  const print = side === "back" ? backPrint(spec, silhouette) : frontPrint(spec, silhouette);

  // The detail shot is the front view, zoomed onto the crest and fabric.
  const viewBox = view === "detail" ? (silhouette === VEST ? "300 180 400 500" : "380 240 400 500") : `0 0 ${W} ${H}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${viewBox}">
${xml}
<rect x="-500" y="-500" width="${W + 1000}" height="${H + 1000}" fill="url(#bg)"/>
<ellipse cx="500" cy="1100" rx="300" ry="34" fill="url(#floor)"/>
<g filter="url(#shadow)" opacity="0.22" transform="translate(0,18)"><path d="${body}" fill="#000"/></g>
${layers}
${print}
${shading(silhouette)}
</svg>`;
}
