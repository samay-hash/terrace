// Editorial photography used across the store. Every image is free to use;
// all are credited on the Help page (see PhotoCredits).
const BASE = "/images/editorial";

export const PHOTOS = {
  court: {
    alt: "Black trainers on the polished floor of an indoor basketball court",
    credit: { author: "Hermes Rivera", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Nike_ready_to_ball_(Unsplash).jpg" },
  },
  "watch-drive": {
    alt: "A chronograph on a leather strap, worn at the wheel of a car",
    credit: { author: "Nino Ubezio", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Watch_your_street_(Unsplash).jpg" },
  },
  basketball: {
    alt: "A hand palming a basketball",
    credit: { author: "Chelsea Ferenando", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Palming_a_basketball_(Unsplash).jpg" },
  },
  "sneakers-steps": {
    alt: "Grey knit trainers on stone steps",
    credit: { author: "Ayo Ogunseinde", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Houston_sneakers_(Unsplash).jpg" },
  },
  duffel: {
    alt: "A brown leather duffel bag resting on the ground",
    credit: { author: "Harsh Jadav", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Leather_duffel_bag_on_the_ground.jpg" },
  },
  sunglasses: {
    alt: "Black sunglasses resting on a stone ledge",
    credit: { author: "Steve Halama", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Steve_Halama_2017-02-02_(Unsplash).jpg" },
  },
  "street-walk": {
    alt: "Suede boots and black jeans walking past a white brick wall",
    credit: { author: "Brooke Cagle", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Brooke_Cagle_2017-06-01_(Unsplash_ebVbGGRZD2I).jpg" },
  },
  "wrist-chrono": {
    alt: "A steel chronograph on a wrist",
    credit: { author: "Unknown (Unsplash)", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Watch_on_a_wrist_(Unsplash).jpg" },
  },
  track: {
    alt: "Lane numbers on a red running track",
    credit: { author: "Kolleen Gladden", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Starting_line_(Unsplash).jpg" },
  },
};

export function photoSrc(name, width = 1920) {
  return `${BASE}/${name}-${width}.webp`;
}

// Props for a responsive <img>: the browser picks the 960 or 1920 version.
export function photoProps(name, sizes = "100vw") {
  return {
    src: photoSrc(name, 1920),
    srcSet: `${photoSrc(name, 960)} 960w, ${photoSrc(name, 1920)} 1920w`,
    sizes,
    alt: PHOTOS[name]?.alt ?? "",
  };
}
