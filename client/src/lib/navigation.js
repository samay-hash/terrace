// Only follow redirects to paths inside this site (blocks open redirects
// like ?next=//evil.example or ?next=https://evil.example).
export function safeNext(value, fallback = "/") {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}
