import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { StoreLayout } from "./components/layout/StoreLayout.jsx";
import { RequireAuth, RequireAdmin } from "./components/auth/RouteGuards.jsx";
import { PageLoader } from "./components/ui/Feedback.jsx";
import Home from "./pages/Home.jsx";

const Shop = lazy(() => import("./pages/Shop.jsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.jsx"));
const CartPage = lazy(() => import("./pages/CartPage.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const OrderPage = lazy(() => import("./pages/OrderPage.jsx"));
const Account = lazy(() => import("./pages/Account.jsx"));
const Help = lazy(() => import("./pages/Help.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

// The admin dashboard is its own bundle; shoppers never download it.
const AdminLayout = lazy(() => import("./components/admin/AdminLayout.jsx"));
const AdminOverview = lazy(() => import("./pages/admin/Overview.jsx"));
const AdminProducts = lazy(() => import("./pages/admin/Products.jsx"));
const AdminProductEdit = lazy(() => import("./pages/admin/ProductEdit.jsx"));
const AdminCategories = lazy(() => import("./pages/admin/Categories.jsx"));
const AdminOrders = lazy(() => import("./pages/admin/Orders.jsx"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews.jsx"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="product/:slug" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="help" element={<Help />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route element={<RequireAuth />}>
              <Route path="checkout" element={<Checkout />} />
              <Route path="account" element={<Account />} />
              <Route path="orders/:id" element={<OrderPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />

          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductEdit />} />
              <Route path="products/:id" element={<AdminProductEdit />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="reviews" element={<AdminReviews />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
