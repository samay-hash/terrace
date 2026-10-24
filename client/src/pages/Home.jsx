import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { CinematicHero } from "../components/home/Hero.jsx";
import { CategoryExplorer, Closing, ParallaxBand, ProductTabs, SaleBanner, ScrollStory } from "../components/home/HomeSections.jsx";

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <CinematicHero />
      <ProductTabs />
      <CategoryExplorer />
      <ParallaxBand
        id="band-watches"
        photo="watch-drive"
        kicker="The watch room"
        title="Time, well kept."
        text="Steel divers and leather-strap chronographs from Rolex, Longines and IWC, sized for free and delivered in a presentation box."
        cta={{ to: "/shop?category=watches", label: "Explore watches" }}
      />
      <ScrollStory />
      <SaleBanner />
      <ParallaxBand
        id="band-eyewear"
        photo="sunglasses"
        kicker="Eyewear"
        title="Bright days, handled."
        text="UV400 aviators, clubmasters and shields, with a hard case in every box."
        cta={{ to: "/shop?category=eyewear", label: "Shop sunglasses" }}
        align="right"
      />
      <Closing />
    </>
  );
}
