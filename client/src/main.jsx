import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { App } from "./App.jsx";
import "./styles/tokens.css";
import "./styles/base.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Client errors (404, 403…) won't fix themselves; only retry the rest.
      retry: (count, error) => (error?.status >= 400 && error?.status < 500 ? false : count < 2),
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <App />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
