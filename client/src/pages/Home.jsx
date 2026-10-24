import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { Hero } from "../components/home/Hero.jsx";
import {
  AskChotu,
  CategoryExplorer,
  EditorialDuo,
  ProductTabs,
  Promises,
  ReviewsStrip,
  SaleBanner,
} from "../components/home/HomeSections.jsx";

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Hero />
      <Promises />
      <CategoryExplorer />
      <ProductTabs />
      <EditorialDuo />
      <SaleBanner />
      <ReviewsStrip />
      <AskChotu />
    </>
  );
}
