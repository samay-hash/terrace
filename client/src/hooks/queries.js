import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).items,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProducts(params, options = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: ({ signal }) => api.get("/products", { query: params, signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: ({ signal }) => api.get(`/products/${slug}`, { signal }),
    enabled: Boolean(slug),
    retry: (count, error) => error.status !== 404 && count < 2,
  });
}

export function useFacets(category) {
  return useQuery({
    queryKey: ["facets", category ?? "all"],
    queryFn: () => api.get("/products/facets", { query: { category } }),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

// Products by slug, in the order given (wishlist, recently viewed).
export function useProductsBySlugs(slugs) {
  return useQuery({
    queryKey: ["products", "slugs", slugs],
    queryFn: async () => {
      const { items } = await api.get("/products", { query: { slugs: slugs.join(","), limit: 48 } });
      const bySlug = new Map(items.map((p) => [p.slug, p]));
      return slugs.map((s) => bySlug.get(s)).filter(Boolean);
    },
    enabled: slugs.length > 0,
    placeholderData: keepPreviousData,
  });
}

export function useProductReviews(slug, params) {
  return useQuery({
    queryKey: ["reviews", slug, params],
    queryFn: () => api.get(`/products/${slug}/reviews`, { query: params }),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
  });
}

export function useReviewHighlights() {
  return useQuery({ queryKey: ["reviews", "highlights"], queryFn: () => api.get("/reviews/highlights"), staleTime: 10 * 60 * 1000 });
}

export function useMyOrders(enabled = true) {
  return useQuery({ queryKey: ["orders", "mine"], queryFn: async () => (await api.get("/orders")).items, enabled });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => (await api.get(`/orders/${id}`)).order,
    enabled: Boolean(id),
    retry: (count, error) => error.status !== 404 && count < 2,
  });
}
