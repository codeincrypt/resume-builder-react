/**
 * Fonts are bundled (Fontsource) rather than loaded from Google: no third-party
 * request when someone opens their résumé, and the PDF exporter can rely on
 * them being present. Each family is a variable font, so one file covers every
 * weight, and the browser only downloads the unicode subsets actually used.
 */
import "@fontsource-variable/inter";
import "@fontsource-variable/source-sans-3";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/work-sans";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/merriweather";
import "@fontsource-variable/lora";
import "@fontsource-variable/lora/wght-italic.css";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/eb-garamond/wght-italic.css";
import "@fontsource-variable/libre-baskerville";
import "@fontsource-variable/crimson-pro";
import "@fontsource-variable/jetbrains-mono";

export interface FontOption {
  key: string;
  label: string;
  stack: string;
  kind: "sans" | "serif" | "mono";
}

export const FONTS: FontOption[] = [
  { key: "inter", label: "Inter", kind: "sans", stack: "'Inter Variable', Arial, sans-serif" },
  { key: "source-sans", label: "Source Sans 3", kind: "sans", stack: "'Source Sans 3 Variable', Arial, sans-serif" },
  { key: "montserrat", label: "Montserrat", kind: "sans", stack: "'Montserrat Variable', Arial, sans-serif" },
  { key: "plex-sans", label: "IBM Plex Sans", kind: "sans", stack: "'IBM Plex Sans Variable', Arial, sans-serif" },
  { key: "dm-sans", label: "DM Sans", kind: "sans", stack: "'DM Sans Variable', Arial, sans-serif" },
  { key: "work-sans", label: "Work Sans", kind: "sans", stack: "'Work Sans Variable', Arial, sans-serif" },
  { key: "space-grotesk", label: "Space Grotesk", kind: "sans", stack: "'Space Grotesk Variable', Arial, sans-serif" },
  { key: "merriweather", label: "Merriweather", kind: "serif", stack: "'Merriweather Variable', Georgia, serif" },
  { key: "lora", label: "Lora", kind: "serif", stack: "'Lora Variable', Georgia, serif" },
  { key: "playfair", label: "Playfair Display", kind: "serif", stack: "'Playfair Display Variable', Georgia, serif" },
  { key: "garamond", label: "EB Garamond", kind: "serif", stack: "'EB Garamond Variable', Georgia, serif" },
  { key: "baskerville", label: "Libre Baskerville", kind: "serif", stack: "'Libre Baskerville Variable', Georgia, serif" },
  { key: "crimson", label: "Crimson Pro", kind: "serif", stack: "'Crimson Pro Variable', Georgia, serif" },
  { key: "jetbrains", label: "JetBrains Mono", kind: "mono", stack: "'JetBrains Mono Variable', Menlo, monospace" },
];

const BY_KEY = new Map(FONTS.map((f) => [f.key, f]));

export function getFont(key: string | null | undefined, fallback = "inter"): FontOption {
  return (key && BY_KEY.get(key)) || (BY_KEY.get(fallback) as FontOption);
}

/**
 * Load the fonts a sheet uses and wait until they are ready. Measuring (for
 * pagination) or rasterising (for the PDF) before this would capture
 * fallback-font metrics and lay out differently from what the user sees —
 * `document.fonts.ready` alone is not enough, because a face is not requested
 * until something has asked for it.
 */
export async function loadFonts(stacks: string[]): Promise<void> {
  if (!("fonts" in document)) return;
  try {
    await Promise.all(
      stacks.flatMap((stack) => [
        document.fonts.load(`400 16px ${stack}`),
        document.fonts.load(`700 16px ${stack}`),
        document.fonts.load(`italic 400 16px ${stack}`),
      ]),
    );
    await document.fonts.ready;
  } catch {
    // A font that fails to load falls back to the next in the stack.
  }
}
