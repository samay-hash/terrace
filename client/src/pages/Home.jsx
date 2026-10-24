import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { Hero } from "../components/home/Hero.jsx";
import { AskChotu, CategoryRail, ProductTabs, PromoBanner, RetroRoom } from "../components/home/HomeSections.jsx";

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Hero />
      <CategoryRail />
      <ProductTabs />
      <PromoBanner />
      <RetroRoom />
      <AskChotu />
    </>
  );
}
