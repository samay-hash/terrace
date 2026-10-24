import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header.jsx";
import { Footer } from "./Footer.jsx";
import { CartDrawer } from "../cart/CartDrawer.jsx";
import { ChatWidget } from "../chat/ChatWidget.jsx";
import { PageLoader } from "../ui/Feedback.jsx";

export function StoreLayout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <ChatWidget />
    </>
  );
}
