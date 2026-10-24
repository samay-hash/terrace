// Demo catalogue for the seed script. Every product is an original Terrace
// design (fictional clubs and sponsors, national colourways without
// federation badges). `kit` drives the rendered product photography.

export const categories = [
  { name: "Club football", slug: "club-football", sortOrder: 1, description: "Home, away and third shirts for the clubs we made up and the ones you'll adopt." },
  { name: "International", slug: "international", sortOrder: 2, description: "National colourways for tournament summers, cut for the stands." },
  { name: "Retro classics", slug: "retro", sortOrder: 3, description: "Faithful tributes to the shirts of the 80s, 90s and early 2000s." },
  { name: "Cricket", slug: "cricket", sortOrder: 4, description: "Coloured-clothing and Test shirts with proper polo collars." },
  { name: "Basketball", slug: "basketball", sortOrder: 5, description: "Double-knit vests with tackle-twill numbers and wide armholes." },
  { name: "Training", slug: "training", sortOrder: 6, description: "Pre-match and warm-up tops for five-a-side, nets and the gym." },
];

const FAN = [
  "Recycled polyester piqué with a mesh back panel",
  "Regular fit, true to size",
  "Embroidered crest, heat-pressed sponsor",
  "Shown with a sample name and number; ships unprinted",
];
const RETRO = [
  "Heavyweight knit with a soft, matte finish",
  "Boxier 90s cut; size down if between sizes",
  "Woven collar and ribbed cuffs",
  "Embroidered crest",
];
const CRICKET = [
  "Quick-dry stretch knit with side mesh panels",
  "Polo collar with two-button placket",
  "Regular fit with a longer back hem",
  "Shown with a sample name and number; ships unprinted",
];
const HOOPS = [
  "Double-knit mesh, 180 gsm",
  "Tackle-twill wordmark and numbers",
  "Wide armholes and a longer drop hem",
];
const TRAINING = [
  "Lightweight 140 gsm performance knit",
  "Flatlock seams that don't rub",
  "Regular fit with room through the shoulders",
];

// sizes: stock per size, XS..XXL. 0 means sold out in that size.
const s = (xs, sm, m, l, xl, xxl) =>
  [
    ["XS", xs],
    ["S", sm],
    ["M", m],
    ["L", l],
    ["XL", xl],
    ["XXL", xxl],
  ]
    .filter(([, stock]) => stock !== null)
    .map(([label, stock]) => ({ label, stock }));

export const products = [
  // ---------------- Club football ----------------
  {
    name: "Deccan Rovers Home Shirt 26/27",
    category: "club-football", team: "Deccan Rovers", season: "26/27", kitType: "home",
    price: 2499, isFeatured: true, salesCount: 184, ageDays: 6,
    sizes: s(4, 18, 26, 22, 14, 6),
    description:
      "Claret body, sky-blue sleeves and a sky crew neck: the Rovers have worn this combination since the first floodlit derby at the old ground. This season's shirt keeps it simple and lets the colours do the talking.\n\nCut from a breathable piqué that holds its shape through ninety minutes of shouting.",
    details: FAN,
    kit: { base: "#7A1F3D", sleeves: "#8CC8E8", secondary: "#7A1F3D", pattern: "solid", trim: "#8CC8E8", collar: "crew", cuffs: "#7A1F3D", crest: { bg: "#7A1F3D", fg: "#8CC8E8", initials: "DR" }, sponsor: { text: "PLATEAU", color: "#F3EFE6" }, printName: "RAO", number: "10", seed: 11 },
  },
  {
    name: "Deccan Rovers Away Shirt 26/27",
    category: "club-football", team: "Deccan Rovers", season: "26/27", kitType: "away",
    price: 2499, salesCount: 96, ageDays: 6,
    sizes: s(2, 10, 16, 15, 9, 3),
    description:
      "Bone-white with fine claret pinstripes and a claret V-neck. The away shirt nods to the tailored kits the club wore on its first trips north, and looks as good at a wedding sangeet as it does at the ground.",
    details: FAN,
    kit: { base: "#F1EDE4", secondary: "#7A1F3D", pattern: "pinstripes", period: 30, lineWidth: 3, trim: "#7A1F3D", collar: "vneck", crest: { bg: "#F1EDE4", fg: "#7A1F3D", initials: "DR" }, sponsor: { text: "PLATEAU", color: "#7A1F3D" }, printName: "RAO", number: "10", numberColor: "#7A1F3D", seed: 12 },
  },
  {
    name: "Malabar Tide Home Shirt 26/27",
    category: "club-football", team: "Malabar Tide", season: "26/27", kitType: "home",
    price: 2599, isFeatured: true, salesCount: 212, ageDays: 4,
    sizes: s(5, 20, 30, 28, 18, 8),
    description:
      "Teal and deep-navy stripes for the club from the coast, finished with a monsoon-gold collar and cuffs. The stripes are knitted in rather than printed, so they stay sharp wash after wash.",
    details: FAN,
    kit: { base: "#0E7C7B", secondary: "#13294B", pattern: "stripes", period: 92, trim: "#F2C14E", collar: "crew", crest: { bg: "#13294B", fg: "#F2C14E", initials: "MT" }, sponsor: { text: "MONSOON AIR", color: "#FFFFFF" }, printName: "NAIR", number: "9", seed: 13 },
  },
  {
    name: "Malabar Tide Third Shirt 26/27",
    category: "club-football", team: "Malabar Tide", season: "26/27", kitType: "third",
    price: 2699, compareAtPrice: 2999, salesCount: 74, ageDays: 2,
    sizes: s(0, 6, 12, 11, 7, 2),
    description:
      "Black with a single gold sash running shoulder to hip. The third shirt is for cup nights and away ends, and the one most likely to sell out before the season really starts.",
    details: FAN,
    kit: { base: "#16171B", secondary: "#C9A227", pattern: "sash", trim: "#C9A227", collar: "vneck", crest: { bg: "#16171B", fg: "#C9A227", initials: "MT" }, sponsor: { text: "MONSOON AIR", color: "#FFFFFF" }, printName: "NAIR", number: "9", numberColor: "#C9A227", seed: 14 },
  },
  {
    name: "Howrah Union Home Shirt 26/27",
    category: "club-football", team: "Howrah Union", season: "26/27", kitType: "home",
    price: 2399, salesCount: 141, ageDays: 18,
    sizes: s(3, 14, 22, 20, 12, 5),
    description:
      "Pillar-box red with white sleeves and a white crew collar. Union have played in red since 1931, and the white sleeves arrived in the sixties after a famously cold away day. Nobody has dared change them since.",
    details: FAN,
    kit: { base: "#C8102E", sleeves: "#F7F5F0", secondary: "#C8102E", pattern: "solid", trim: "#F7F5F0", cuffs: "#C8102E", collar: "crew", crest: { shape: "round", bg: "#C8102E", fg: "#F7F5F0", initials: "HU" }, sponsor: { text: "GANGES RAIL", color: "#F7F5F0" }, printName: "DAS", number: "8", seed: 15 },
  },
  {
    name: "Konkan Athletic Home Shirt 26/27",
    category: "club-football", team: "Konkan Athletic", season: "26/27", kitType: "home",
    price: 2399, salesCount: 88, ageDays: 25,
    sizes: s(2, 8, 14, 14, 10, 4),
    description:
      "Green-and-white hoops with a green crew neck, as worn by Athletic on the coast road since the club began on a cashew-farm pitch. Heavy hoops, light fabric.",
    details: FAN,
    kit: { base: "#F5F3EE", secondary: "#1F7A3E", pattern: "hoops", period: 104, trim: "#1F7A3E", collar: "crew", sleeves: "#F5F3EE", cuffs: "#1F7A3E", crest: { bg: "#1F7A3E", fg: "#F5F3EE", initials: "KA" }, sponsor: { text: "SAGAR", color: "#16171B" }, printName: "PEREIRA", number: "4", numberColor: "#1F7A3E", seed: 16 },
  },
  {
    name: "Harbour City Away Shirt 26/27",
    category: "club-football", team: "Harbour City", season: "26/27", kitType: "away",
    price: 2299, salesCount: 63, ageDays: 32,
    sizes: s(1, 9, 15, 13, 8, 0),
    description:
      "Navy with a bold signal-orange chevron across the chest, inspired by the harbour pilot boats the club is named after. Easy to spot from the top tier.",
    details: FAN,
    kit: { base: "#152238", secondary: "#F26B1D", pattern: "chevron", trim: "#F26B1D", collar: "crew", crest: { shape: "diamond", bg: "#152238", fg: "#F26B1D", initials: "HC" }, sponsor: { text: "PILOT", color: "#FFFFFF", y: 720 }, printName: "SHETTY", number: "11", seed: 17 },
  },
  {
    name: "Northern Lights FC Home Shirt 26/27",
    category: "club-football", team: "Northern Lights FC", season: "26/27", kitType: "home",
    price: 2599, salesCount: 39, ageDays: 1,
    sizes: s(3, 12, 18, 16, 10, 4),
    description:
      "A violet-to-teal fade that looks different under every floodlight. Northern Lights only formed in 2019 and decided early that their shirts would never be boring.",
    details: FAN,
    kit: { base: "#4B2A7B", secondary: "#138A8A", pattern: "gradient", trim: "#E8E3F5", collar: "vneck", crest: { bg: "#4B2A7B", fg: "#E8E3F5", initials: "NL" }, sponsor: { text: "AURORA", color: "#FFFFFF" }, printName: "GILL", number: "17", seed: 18 },
  },

  // ---------------- International ----------------
  {
    name: "India Fan Shirt 2026 – Home",
    category: "international", team: "India", season: "2026", kitType: "home",
    price: 1999, isFeatured: true, salesCount: 326, ageDays: 9,
    sizes: s(8, 24, 40, 36, 24, 12),
    description:
      "A deep sky blue with a tonal diagonal weave and saffron-and-green cuffs. Our best-selling shirt, made for match days at home and every watch party in between. No federation badge, just the colours.",
    details: ["Recycled polyester with a tonal diagonal weave", "Regular fit, true to size", "Saffron and green tipping on the cuffs", "Shown with a sample name and number; ships unprinted"],
    kit: { base: "#1F5FAE", secondary: "#2B6CBD", pattern: "diagonal", period: 40, lineWidth: 14, trim: "#FF9933", cuffs: "#FF9933", cuffStripe: "#138808", collar: "crew", collarColor: "#123E75", crest: { shape: "round", bg: "#1F5FAE", fg: "#FF9933", initials: "IND" }, printName: "SINGH", number: "11", seed: 21 },
  },
  {
    name: "India Fan Shirt 2026 – Away",
    category: "international", team: "India", season: "2026", kitType: "away",
    price: 1999, salesCount: 148, ageDays: 9,
    sizes: s(4, 14, 22, 20, 14, 6),
    description:
      "Clean white with a navy chest band edged in saffron. Lighter than the home shirt and a better pick for afternoon kick-offs in May.",
    details: ["Recycled polyester piqué", "Regular fit, true to size", "Navy chest band with saffron edging", "Shown with a sample name and number; ships unprinted"],
    kit: { base: "#F7F6F2", secondary: "#123E75", pattern: "band", bandY: 470, bandHeight: 84, shoulderYoke: null, trim: "#123E75", collar: "vneck", crest: { shape: "round", bg: "#F7F6F2", fg: "#123E75", initials: "IND" }, sponsor: null, printName: "SINGH", number: "11", numberColor: "#123E75", seed: 22 },
  },
  {
    name: "Brazil Tribute Shirt – Canary",
    category: "international", team: "Brazil", season: "2026", kitType: "home",
    price: 2199, salesCount: 172, ageDays: 40,
    sizes: s(2, 12, 18, 18, 12, 5),
    description:
      "Canary yellow with a green crew neck and green cuffs: the most recognisable colour combination in football, done our way with a Terrace crest.",
    details: FAN,
    kit: { base: "#F7D117", secondary: "#F7D117", pattern: "solid", trim: "#0B8F44", collar: "crew", crest: { bg: "#0B8F44", fg: "#F7D117", initials: "BRA" }, printName: "SANTOS", number: "10", numberColor: "#0B8F44", markColor: "#0B8F44", seed: 23 },
  },
  {
    name: "Argentina Tribute Shirt – Albiceleste",
    category: "international", team: "Argentina", season: "2026", kitType: "home",
    price: 2199, salesCount: 205, ageDays: 40,
    sizes: s(3, 10, 16, 18, 10, 4),
    description:
      "Sky-blue and white stripes with a black crew neck. A tribute to the most romantic stripes in the world game, finished with a gold-thread crest.",
    details: FAN,
    kit: { base: "#F8F8F6", secondary: "#75AADB", pattern: "stripes", period: 104, trim: "#16171B", collar: "crew", sleeves: "#F8F8F6", crest: { bg: "#16171B", fg: "#D4AF37", initials: "ARG" }, printName: "MEDINA", number: "10", numberColor: "#16171B", markColor: "#16171B", seed: 24 },
  },
  {
    name: "Netherlands Tribute Shirt – Oranje",
    category: "international", team: "Netherlands", season: "2026", kitType: "home",
    price: 2099, compareAtPrice: 2499, salesCount: 77, ageDays: 55,
    sizes: s(1, 6, 10, 9, 6, 2),
    description:
      "All orange, navy collar, no apologies. A tribute to the total-football sides of the seventies, now on sale while the last sizes last.",
    details: FAN,
    kit: { base: "#F36C21", secondary: "#F36C21", pattern: "solid", trim: "#1C2A57", collar: "vneck", crest: { shape: "round", bg: "#F36C21", fg: "#1C2A57", initials: "NED" }, printName: "VISSER", number: "14", numberColor: "#1C2A57", seed: 25 },
  },
  {
    name: "Japan Tribute Shirt – Indigo",
    category: "international", team: "Japan", season: "2026", kitType: "home",
    price: 2199, salesCount: 58, ageDays: 3,
    sizes: s(4, 10, 14, 12, 8, 2),
    description:
      "Indigo with fine silver diagonal lines, inspired by traditional aizome dyeing. Red crew collar for contrast. One of the quieter shirts in the range, and one of our favourites.",
    details: FAN,
    kit: { base: "#1B2A6B", secondary: "#9AA6C8", pattern: "diagonal", period: 36, lineWidth: 3, patternOpacity: 0.55, trim: "#D7263D", collar: "crew", crest: { bg: "#1B2A6B", fg: "#F5F5F5", initials: "JPN" }, printName: "TANAKA", number: "7", seed: 26 },
  },

  // ---------------- Retro classics ----------------
  {
    name: "Paris Nights '95 Retro Shirt",
    category: "retro", team: "Paris Nights", season: "1995", kitType: "retro",
    price: 2399, compareAtPrice: 2799, isFeatured: true, salesCount: 233, ageDays: 70,
    sizes: s(2, 9, 14, 12, 7, 0),
    description:
      "Navy with a red centre band edged in white and a big white polo collar. The mid-nineties at their most confident. We matched the original band width to the millimetre.",
    details: RETRO,
    kit: { base: "#14254F", secondary: "#C8102E", tertiary: "#FFFFFF", pattern: "centre-band", trim: "#FFFFFF", collar: "polo", collarColor: "#FFFFFF", placket: "#C8102E", crest: { shape: "round", bg: "#14254F", fg: "#FFFFFF", initials: "PN" }, sponsor: { text: "LUMEN", color: "#FFFFFF", size: 42, spacing: 2 }, printName: "BOSE", number: "7", numberOutline: "#14254F", seed: 31 },
  },
  {
    name: "Buenos Aires '86 Retro Shirt",
    category: "retro", team: "Buenos Aires Athletic", season: "1986", kitType: "retro",
    price: 2299, isFeatured: true, salesCount: 167, ageDays: 80,
    sizes: s(1, 8, 12, 12, 8, 3),
    description:
      "White with a red sash, red cuffs and a ribbed crew neck. Tribute to the sash shirts of the River Plate basin in the year everyone remembers.",
    details: RETRO,
    kit: { base: "#F6F4EE", secondary: "#D2232A", pattern: "sash", trim: "#D2232A", collar: "crew", sleeves: "#F6F4EE", cuffs: "#D2232A", crest: { bg: "#F6F4EE", fg: "#D2232A", initials: "BA" }, printName: "FERREYRA", number: "6", numberColor: "#16171B", seed: 32 },
  },
  {
    name: "Genova '92 Retro Quarters Shirt",
    category: "retro", team: "Genova Portuale", season: "1992", kitType: "retro",
    price: 2299, salesCount: 71, ageDays: 95,
    sizes: s(0, 4, 8, 9, 5, 1),
    description:
      "Claret-and-navy quarters with a navy polo collar. Quartered shirts went out of fashion for twenty years; we think they deserve a second life.",
    details: RETRO,
    kit: { base: "#1B2A57", secondary: "#8A1538", pattern: "quarters", quarterSplit: 470, trim: "#F2E8D5", collar: "polo", collarColor: "#1B2A57", sleeves: "#1B2A57", crest: { bg: "#8A1538", fg: "#F2E8D5", initials: "GP" }, sponsor: { text: "LANTERNA", color: "#F2E8D5" }, printName: "MARCHETTI", number: "9", numberColor: "#F2E8D5", seed: 33 },
  },
  {
    name: "Amsterdam '95 Retro Shirt",
    category: "retro", team: "Amsterdam Stad", season: "1995", kitType: "retro",
    price: 2299, salesCount: 119, ageDays: 88,
    sizes: s(2, 7, 12, 11, 6, 2),
    description:
      "White with a wide red centre band and a white polo collar. A tribute to the youngest European champions of the decade, and still one of the cleanest designs ever made.",
    details: RETRO,
    kit: { base: "#F7F6F2", secondary: "#D2122E", pattern: "centre-band", trim: "#D2122E", collar: "polo", collarColor: "#F7F6F2", collarStripe: "#D2122E", placket: "#D2122E", crest: { shape: "round", bg: "#F7F6F2", fg: "#D2122E", initials: "AS" }, sponsor: { text: "KANAAL", color: "#FFFFFF", size: 40, spacing: 1 }, printName: "JANSEN", number: "10", numberColor: "#16171B", seed: 34 },
  },
  {
    name: "Manchester '99 Retro Shirt",
    category: "retro", team: "Manchester Docks", season: "1999", kitType: "retro",
    price: 2499, salesCount: 298, ageDays: 120,
    sizes: s(3, 12, 20, 18, 12, 6),
    description:
      "Red with a black-and-white polo collar and a big ORBIT sponsor across the chest. The treble-season silhouette everyone wanted in the playground.",
    details: RETRO,
    kit: { base: "#C4111B", secondary: "#C4111B", pattern: "solid", trim: "#F5F5F5", collar: "polo", collarColor: "#F5F5F5", collarStripe: "#16171B", placket: "#F5F5F5", crest: { bg: "#C4111B", fg: "#F5D547", initials: "MD" }, sponsor: { text: "ORBIT", color: "#F5F5F5" }, printName: "HOLT", number: "20", seed: 35 },
  },
  {
    name: "Napoli '87 Retro Shirt",
    category: "retro", team: "Partenope", season: "1987", kitType: "retro",
    price: 2299, salesCount: 154, ageDays: 110,
    sizes: s(1, 8, 13, 12, 7, 2),
    description:
      "Sky blue with a white V collar and white cuffs, the colour of the bay on a clear day. A tribute to the first title in the south and the summer the whole city stayed up.",
    details: RETRO,
    kit: { base: "#2C9AD6", secondary: "#2C9AD6", pattern: "solid", trim: "#FFFFFF", collar: "vneck", crest: { shape: "round", bg: "#2C9AD6", fg: "#FFFFFF", initials: "P" }, sponsor: { text: "MERIDIAN", color: "#FFFFFF" }, printName: "ESPOSITO", number: "10", seed: 36 },
  },
  {
    name: "Lisbon '91 Retro Away Shirt",
    category: "retro", team: "Lisboa Marítimo", season: "1991", kitType: "retro",
    price: 2199, compareAtPrice: 2599, salesCount: 46, ageDays: 140,
    sizes: s(0, 3, 6, 5, 2, 0),
    description:
      "Black with fine gold pinstripes and a gold polo collar. Away shirts in the early nineties were allowed to be strange; this one is strange in the best way.",
    details: RETRO,
    kit: { base: "#18181B", secondary: "#B8962E", pattern: "pinstripes", period: 38, lineWidth: 3, trim: "#B8962E", collar: "polo", collarColor: "#B8962E", crest: { bg: "#18181B", fg: "#B8962E", initials: "LM" }, sponsor: { text: "TEJO", color: "#B8962E" }, printName: "COSTA", number: "11", numberColor: "#B8962E", seed: 37 },
  },
  {
    name: "Calcutta Athletic '86 Retro Shirt",
    category: "retro", team: "Calcutta Athletic", season: "1986", kitType: "retro",
    price: 2199, salesCount: 0, ageDays: 150,
    sizes: s(0, 0, 0, 0, 0, 0),
    description:
      "Green-and-maroon halves with a white polo collar, a tribute to the Maidan derbies of the eighties. Sold out for now; a restock is being knitted.",
    details: RETRO,
    kit: { base: "#0F6B3C", secondary: "#7B1E2B", pattern: "halves", trim: "#F5F2EA", collar: "polo", collarColor: "#F5F2EA", crest: { bg: "#F5F2EA", fg: "#7B1E2B", initials: "CA" }, printName: "GHOSH", number: "5", numberColor: "#F5F2EA", seed: 38 },
  },

  // ---------------- Cricket ----------------
  {
    name: "India ODI Tribute Shirt 2026",
    category: "cricket", team: "India", season: "2026", kitType: "home",
    price: 1799, isFeatured: true, salesCount: 288, ageDays: 12,
    sizes: s(6, 20, 32, 30, 20, 10),
    description:
      "Deep blue with a saffron shoulder yoke and green side panels, finished with a proper polo collar. Built for long afternoons in the stands and the occasional catch on the boundary rope.",
    details: CRICKET,
    kit: { base: "#123C8C", secondary: "#123C8C", pattern: "solid", shoulderYoke: "#F58A1F", sidePanels: "#138808", trim: "#F58A1F", collar: "polo", collarColor: "#123C8C", collarStripe: "#F58A1F", crest: { shape: "round", bg: "#123C8C", fg: "#F58A1F", initials: "IND" }, printName: "MENON", number: "18", seed: 41 },
  },
  {
    name: "Mumbai Tide T20 Shirt",
    category: "cricket", team: "Mumbai Tide", season: "2026", kitType: "home",
    price: 1699, salesCount: 164, ageDays: 15,
    sizes: s(3, 12, 20, 18, 12, 6),
    description:
      "Royal blue fading into gold at the hem, with gold side panels and a navy polo collar. A franchise shirt for a franchise that only exists at Terrace, but the stands don't need to know that.",
    details: CRICKET,
    kit: { base: "#0B4AA2", secondary: "#D4A017", pattern: "gradient", sidePanels: "#D4A017", trim: "#D4A017", collar: "polo", collarColor: "#0A2C66", crest: { bg: "#0A2C66", fg: "#D4A017", initials: "MT" }, sponsor: { text: "SEALINK", color: "#FFFFFF" }, printName: "PATIL", number: "45", seed: 42 },
  },
  {
    name: "Chennai Lions T20 Shirt",
    category: "cricket", team: "Chennai Lions", season: "2026", kitType: "home",
    price: 1699, salesCount: 201, ageDays: 15,
    sizes: s(4, 14, 22, 20, 14, 8),
    description:
      "Lion yellow with navy side panels and a navy collar. Bright enough to be seen from the top of the Anna Pavilion, breathable enough for a Chennai April.",
    details: CRICKET,
    kit: { base: "#F9CD05", secondary: "#F9CD05", pattern: "solid", sidePanels: "#1D3C78", trim: "#1D3C78", collar: "polo", collarColor: "#1D3C78", crest: { shape: "shield", bg: "#1D3C78", fg: "#F9CD05", initials: "CL" }, sponsor: { text: "MARINA", color: "#1D3C78" }, printName: "RAJAN", number: "7", numberColor: "#1D3C78", markColor: "#1D3C78", seed: 43 },
  },
  {
    name: "Test Whites Classic Shirt",
    category: "cricket", team: "Terrace", season: "Classic", kitType: "special",
    price: 1999, salesCount: 59, ageDays: 60,
    sizes: s(2, 8, 12, 12, 8, 3),
    description:
      "Cream whites with navy-and-maroon collar tipping, cut long in the back. For five-day matches, club Sundays and anyone who misses the sound of leather on willow.",
    details: ["Cotton-feel piqué in cricket cream", "Polo collar with navy and maroon tipping", "Longer back hem that stays tucked", "Embroidered Terrace crest"],
    kit: { base: "#F3EEDF", secondary: "#F3EEDF", pattern: "solid", trim: "#1D2B4F", collar: "polo", collarColor: "#F3EEDF", collarStripe: "#7B1E2B", cuffs: "#F3EEDF", cuffStripe: "#1D2B4F", crest: { bg: "#F3EEDF", fg: "#1D2B4F", initials: "TC" }, printName: "TERRACE", number: "1", numberColor: "#1D2B4F", markColor: "#1D2B4F", seed: 44 },
  },
  {
    name: "Eastern Storm T20 Shirt",
    category: "cricket", team: "Eastern Storm", season: "2026", kitType: "away",
    price: 1699, compareAtPrice: 1999, salesCount: 92, ageDays: 22,
    sizes: s(2, 9, 14, 12, 8, 3),
    description:
      "Storm purple with gold lightning-yoke shoulders and gold collar tipping. Loud, proud, and twenty percent off this week.",
    details: CRICKET,
    kit: { base: "#3B1F6B", secondary: "#3B1F6B", pattern: "solid", shoulderYoke: "#D9A520", trim: "#D9A520", collar: "polo", collarColor: "#3B1F6B", collarStripe: "#D9A520", sidePanels: "#2A1450", crest: { bg: "#3B1F6B", fg: "#D9A520", initials: "ES" }, sponsor: { text: "MONSOON AIR", color: "#FFFFFF" }, printName: "IYER", number: "41", seed: 45 },
  },

  // ---------------- Basketball ----------------
  {
    name: "Harbour City Hoops Vest – Home",
    category: "basketball", team: "Harbour City Hoops", season: "26/27", kitType: "home",
    price: 1899, salesCount: 81, ageDays: 20,
    sizes: s(3, 10, 14, 12, 8, 4),
    description:
      "White double-knit with navy binding and a navy-and-orange wordmark. The vest Harbour City wear on home nights, cut long so it stays tucked on a drive to the rim.",
    details: HOOPS,
    kit: { silhouette: "vest", base: "#F7F6F2", secondary: "#F7F6F2", pattern: "solid", trim: "#152238", trimStripe: "#F26B1D", crest: { initials: "HC", bg: "#fff", fg: "#152238" }, wordmark: "HARBOUR", number: "23", numberColor: "#152238", printName: "MATHEW", seed: 51 },
  },
  {
    name: "Midnight Run Vest",
    category: "basketball", team: "Midnight Run", season: "26/27", kitType: "away",
    price: 1899, compareAtPrice: 2299, isFeatured: true, salesCount: 143, ageDays: 14,
    sizes: s(2, 9, 13, 12, 8, 3),
    description:
      "Matte black with signal-orange binding and numbers. Made for streetball courts after the floodlights come on.",
    details: HOOPS,
    kit: { silhouette: "vest", base: "#16171B", secondary: "#16171B", pattern: "solid", trim: "#F26B1D", crest: { initials: "MR", bg: "#000", fg: "#fff" }, wordmark: "MIDNIGHT", number: "23", numberColor: "#F26B1D", printName: "KHAN", seed: 52 },
  },
  {
    name: "Courtside '96 Retro Vest",
    category: "basketball", team: "Courtside", season: "1996", kitType: "retro",
    price: 2099, salesCount: 67, ageDays: 75,
    sizes: s(1, 5, 9, 8, 5, 2),
    description:
      "Purple with teal pinstripes and teal binding: the mid-nineties expansion-team look, back with heavier mesh and a better fit.",
    details: HOOPS,
    kit: { silhouette: "vest", base: "#4A2A82", secondary: "#2BB3A8", pattern: "pinstripes", period: 30, lineWidth: 4, trim: "#2BB3A8", crest: { initials: "CS", bg: "#fff", fg: "#4A2A82" }, wordmark: "COURTSIDE", number: "3", numberColor: "#FFFFFF", numberOutline: "#2BB3A8", printName: "ANAND", seed: 53 },
  },
  {
    name: "Delhi Dunkers Vest – Away",
    category: "basketball", team: "Delhi Dunkers", season: "26/27", kitType: "away",
    price: 1899, salesCount: 22, ageDays: 2,
    sizes: s(2, 8, 12, 10, 6, 2),
    description:
      "Brick red with white binding and white numbers, inspired by the red sandstone of the old city. New this week.",
    details: HOOPS,
    kit: { silhouette: "vest", base: "#A8322D", secondary: "#A8322D", pattern: "solid", trim: "#F7F6F2", crest: { initials: "DD", bg: "#fff", fg: "#A8322D" }, wordmark: "DUNKERS", number: "11", numberColor: "#F7F6F2", printName: "BHATIA", seed: 54 },
  },

  // ---------------- Training ----------------
  {
    name: "Pre-Match Top – Graphite",
    category: "training", team: "Terrace", season: "26/27", kitType: "training",
    price: 1599, salesCount: 112, ageDays: 10,
    sizes: s(4, 14, 20, 18, 12, 5),
    description:
      "Graphite grey with an angular charcoal print across the chest. Light enough for warm-ups and five-a-side, smart enough for the pub afterwards.",
    details: TRAINING,
    kit: { base: "#4A4E57", secondary: "#2A2D33", pattern: "shards", trim: "#C9F24B", collar: "crew", collarColor: "#2A2D33", crest: { bg: "#4A4E57", fg: "#C9F24B", initials: "T" }, printName: "TERRACE", number: "26", numberColor: "#C9F24B", seed: 61 },
  },
  {
    name: "Training Tee – Volt",
    category: "training", team: "Terrace", season: "26/27", kitType: "training",
    price: 1299, salesCount: 95, ageDays: 28,
    sizes: s(5, 16, 22, 20, 12, 6),
    description:
      "High-visibility volt with a charcoal collar. The tee you'll reach for on early-morning runs, nets sessions and gym days.",
    details: TRAINING,
    kit: { base: "#D4F04C", secondary: "#D4F04C", pattern: "solid", trim: "#2A2D33", collar: "crew", sidePanels: "#BFDB35", crest: { shape: "round", bg: "#D4F04C", fg: "#2A2D33", initials: "T" }, printName: "TERRACE", number: "26", numberColor: "#2A2D33", markColor: "#2A2D33", seed: 62 },
  },
  {
    name: "Warm-up Jersey – Night",
    category: "training", team: "Terrace", season: "26/27", kitType: "training",
    price: 1499, salesCount: 48, ageDays: 35,
    sizes: s(2, 10, 14, 12, 8, 4),
    description:
      "Midnight navy with fine sky-blue diagonal lines and a sky V-neck. Pull it on over a base layer for cold evening sessions.",
    details: TRAINING,
    kit: { base: "#141E3C", secondary: "#5DA9E9", pattern: "diagonal", period: 52, lineWidth: 3, patternOpacity: 0.7, trim: "#5DA9E9", collar: "vneck", crest: { bg: "#141E3C", fg: "#5DA9E9", initials: "T" }, printName: "TERRACE", number: "26", seed: 63 },
  },
  {
    name: "Pre-Match Top – Monsoon",
    category: "training", team: "Terrace", season: "26/27", kitType: "training",
    price: 1599, salesCount: 18, ageDays: 1,
    sizes: s(3, 10, 14, 12, 8, 3),
    description:
      "Teal hoops that fade out towards the hem like rain clearing over the pitch. The newest top in the training range.",
    details: TRAINING,
    kit: { base: "#E9F1EF", secondary: "#0E7C7B", pattern: "fade-hoops", period: 96, trim: "#0E7C7B", collar: "crew", sleeves: "#0E7C7B", cuffs: "#E9F1EF", crest: { bg: "#0E7C7B", fg: "#E9F1EF", initials: "T" }, printName: "TERRACE", number: "26", numberColor: "#0E7C7B", seed: 64 },
  },
  {
    name: "Goalkeeper Shirt – Hi-Vis Pink",
    category: "training", team: "Terrace", season: "26/27", kitType: "special",
    price: 1999, salesCount: 37, ageDays: 45,
    sizes: s(1, 6, 9, 9, 6, 3),
    description:
      "Fluorescent pink with black shoulder panels, padded-feel elbows and a grippy cuff. Strikers will see you. That's the point.",
    details: ["Durable 160 gsm knit with reinforced elbows", "Regular fit with room for base layers", "Black shoulder yoke and cuffs", "Shown with a sample name and number; ships unprinted"],
    kit: { base: "#FF4F9A", secondary: "#FF4F9A", pattern: "solid", shoulderYoke: "#16171B", trim: "#16171B", collar: "crew", sleeves: "#FF4F9A", cuffs: "#16171B", crest: { bg: "#16171B", fg: "#FF4F9A", initials: "T" }, printName: "SANDHU", number: "1", numberColor: "#16171B", markColor: "#16171B", seed: 65 },
  },
];
