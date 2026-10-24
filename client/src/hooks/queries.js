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

export function useFacets() {
  return useQuery({ queryKey: ["facets"], queryFn: () => api.get("/products/facets"), staleTime: 10 * 60 * 1000 });
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
