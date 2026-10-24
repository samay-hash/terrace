import { createContext, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/auth/me")).user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const onSignedIn = (data) => queryClient.setQueryData(["me"], data.user);

  const login = useMutation({ mutationFn: (credentials) => api.post("/auth/login", credentials), onSuccess: onSignedIn });
  const register = useMutation({ mutationFn: (details) => api.post("/auth/register", details), onSuccess: onSignedIn });
  const logout = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      queryClient.setQueryData(["me"], null);
      // Drop everything tied to the previous session.
      queryClient.removeQueries({ queryKey: ["cart"] });
      queryClient.removeQueries({ queryKey: ["orders"] });
      queryClient.removeQueries({ queryKey: ["admin"] });
    },
  });

  const value = useMemo(
    () => ({
      user: user ?? null,
      isAdmin: user?.role === "admin",
      isLoading,
      login: login.mutateAsync,
      register: register.mutateAsync,
      logout: logout.mutateAsync,
    }),
    [user, isLoading, login.mutateAsync, register.mutateAsync, logout.mutateAsync],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
