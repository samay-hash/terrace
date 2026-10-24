// Thin fetch wrapper for the Terrace API. The session lives in an httpOnly
// cookie, so the client never sees or stores a token; it only has to send
// credentials and the CSRF header the API requires on writes.

const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? "Something went wrong. Please try again.");
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code;
    this.details = body?.error?.details;
  }

  // Field-level messages from server validation, keyed by field path.
  get fields() {
    return this.details?.fields ?? {};
  }
}

async function request(path, { method = "GET", body, query, signal } = {}) {
  const url = new URL(`${BASE}/api${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    }
  }

  const isForm = body instanceof FormData;
  const headers = { Accept: "application/json" };
  if (method !== "GET") headers["X-Requested-With"] = "terrace";
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(0, { error: { code: "NETWORK", message: "Can't reach the store. Check your connection and try again." } });
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

// Image URLs from local development uploads are relative to the API.
export function assetUrl(url) {
  if (!url) return "";
  return url.startsWith("/uploads/") ? `${BASE}${url}` : url;
}
