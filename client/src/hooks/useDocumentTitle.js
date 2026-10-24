import { useEffect } from "react";

const BRAND = "Terrace";

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND}` : `${BRAND} — Kit for the stands`;
  }, [title]);
}
