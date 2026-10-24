// Browser storage can be unavailable (private mode, blocked site data), so
// every access is guarded and falls back to "nothing stored".

export function readJSON(key, fallback, store = window.localStorage) {
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value, store = window.localStorage) {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the app keeps working in memory */
  }
}

export function removeKey(key, store = window.localStorage) {
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}
