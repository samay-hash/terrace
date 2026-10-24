import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { CinematicHero, FeaturedStage } from "../components/home/Hero.jsx";
import {
  AskChotu,
  CategoryExplorer,
  ParallaxBand,
  ProductTabs,
  Promises,
  ReviewsStrip,
  SaleBanner,
  ScrollStory,
} from "../components/home/HomeSections.jsx";

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <CinematicHero />
      <Promises />
      <FeaturedStage />
      <CategoryExplorer />
      <ParallaxBand
        id="band-watches"
        photo="watch-drive"
        kicker="The watch room"
        title="Time, well kept."
        text="Steel divers, leather-strap chronographs and the occasional grail from Rolex, Longines and IWC. Sized for free, delivered in a presentation box."
        cta={{ to: "/shop?category=watches", label: "Explore watches" }}
      />
      <ProductTabs />
      <ScrollStory />
      <SaleBanner />
      <ParallaxBand
        id="band-matchday"
        photo="stadium"
        kicker="Matchday"
        title="From nets to floodlights."
        text="English willow bats, match balls and helmets for weekend games, plus everything you need to watch the big one in comfort."
        cta={{ to: "/shop?category=sports", label: "Shop sports gear" }}
        align="right"
      />
      <ReviewsStrip />
      <AskChotu />
    </>
  );
}
