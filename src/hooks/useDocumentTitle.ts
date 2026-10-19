import { useEffect } from "react";

const PRODUCT = "CapitalCV";
const HOME_TITLE = `${PRODUCT} — Resume builder with 25 capital-city templates`;

export function formatTitle(title?: string): string {
  return title ? `${title} · ${PRODUCT}` : HOME_TITLE;
}

/**
 * Give every page its own title: screen readers announce it on navigation,
 * and it is what a tab or a history entry shows.
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = formatTitle(title);
  }, [title]);
}
