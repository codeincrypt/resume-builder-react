import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { loadFonts } from "../resume/fonts";
import { paginate } from "../resume/paginate";
import ResumeSheet, { sheetMetrics } from "../resume/ResumeSheet";
import type { SheetDoc, SheetMetrics } from "../resume/ResumeSheet";

/**
 * PDF export and printing.
 *
 * Both work from the same thing the preview shows: the template is mounted
 * off-screen at its true pixel size, paginated, then
 *
 *  - PDF: each page is rasterised with html2canvas-pro (so typography, colour
 *    and layout match the preview exactly) and an *invisible text layer* is
 *    laid over it at the measured position of every word, so the PDF's text is
 *    selectable, searchable and readable by applicant-tracking systems.
 *  - Print: the sheet itself is printed, as real vector text.
 *
 * `html2canvas-pro` (not `html2canvas`) because the original throws on modern
 * `oklch()` / `lab()` colours. Both libraries are imported on demand so their
 * ~350kB stays out of the initial bundle.
 */

interface Mounted {
  sheet: HTMLElement;
  pages: number;
  metrics: SheetMetrics;
  dispose: () => void;
}

/** Render `doc` off-screen, wait for its fonts, and paginate it. */
async function mountSheet(doc: SheetDoc, host?: HTMLElement): Promise<Mounted> {
  const metrics = sheetMetrics(doc);

  const container = host ?? document.createElement("div");
  if (!host) {
    container.setAttribute("aria-hidden", "true");
    container.style.cssText =
      `position:fixed;top:0;left:-${metrics.pageW + 400}px;` +
      `width:${metrics.pageW}px;pointer-events:none;`;
    document.body.appendChild(container);
  }

  const root = createRoot(container);
  flushSync(() => root.render(createElement(ResumeSheet, { doc })));

  await loadFonts(metrics.fonts);

  const sheet = container.querySelector<HTMLElement>(".rt");
  if (!sheet) throw new Error("The résumé could not be rendered.");

  const pages = paginate(sheet, { pageHeight: metrics.pageH, margin: metrics.margin });
  if (pages === null) throw new Error("The résumé could not be laid out for export.");

  return {
    sheet,
    pages,
    metrics,
    dispose: () => {
      root.unmount();
      if (!host) container.remove();
    },
  };
}

/* --------------------------------------------------------------- text layer */

interface TextRun {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontPx: number;
}

/** The standard PDF fonts only cover Latin-1 plus a few punctuation marks. */
function toWinAnsi(text: string): string {
  return text.replace(/[^ -~\u00A0-ÿ–—‘’“”•…€™]/g, " ");
}

function applyTransform(text: string, transform: string): string {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  return text;
}

/**
 * Every visual line of text in the sheet, with its position in sheet pixels.
 * Words are measured individually and grouped by line, because a wrapped
 * paragraph is one text node but several lines.
 */
function collectTextRuns(sheet: HTMLElement): TextRun[] {
  const origin = sheet.getBoundingClientRect();
  const runs: TextRun[] = [];
  const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  // Bullets are drawn by CSS (::before), so they aren't text. Put a real "•"
  // before each list item's first line, so extracted text keeps the list.
  const bulleted = new Set<Element>();

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const data = node.nodeValue ?? "";
    const parent = node.parentElement;
    if (!parent || !data.trim()) continue;

    const style = getComputedStyle(parent);
    if (style.visibility === "hidden" || style.display === "none") continue;
    const fontPx = parseFloat(style.fontSize) || 12;

    const item = parent.closest(".rt-bullets li");
    let bulletPending = !!item && !bulleted.has(item);
    if (item) bulleted.add(item);

    let line: TextRun | null = null;
    for (const match of data.matchAll(/\S+/g)) {
      const start = match.index ?? 0;
      range.setStart(node, start);
      range.setEnd(node, start + match[0].length);
      const rect = range.getClientRects()[0];
      if (!rect || rect.width === 0) continue;

      const word = applyTransform(match[0], style.textTransform);
      const x = rect.left - origin.left;
      const y = rect.top - origin.top;

      if (line && Math.abs(y - line.y) < fontPx * 0.5 && x >= line.x) {
        line.text += ` ${word}`;
        line.width = x + rect.width - line.x;
      } else {
        if (line) runs.push(line);
        const prefix: string = bulletPending ? "• " : "";
        bulletPending = false;
        line = { text: prefix + word, x, y, width: rect.width, height: rect.height, fontPx };
      }
    }
    if (line) runs.push(line);
  }
  return runs;
}

/* ----------------------------------------------------------------- download */

/** `Ada Lovelace` -> `Ada-Lovelace-Resume.pdf` */
export function resumeFilename(name: string): string {
  const slug = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
  return `${slug || "Resume"}-Resume.pdf`;
}

export interface PdfOptions {
  /** Called with 0–1 as pages are rendered. */
  onProgress?: (fraction: number) => void;
}

/** Build the PDF for `doc` and return it as a Blob. */
export async function buildResumePdf(
  doc: SheetDoc,
  title: string,
  { onProgress }: PdfOptions = {},
): Promise<{ blob: Blob; pages: number }> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const mounted = await mountSheet(doc);
  try {
    const { sheet, pages, metrics } = mounted;
    const { pageW, pageH } = metrics;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: doc.design.pageSize === "letter" ? "letter" : "a4",
      compress: true,
    });
    pdf.setProperties({ title, subject: "Resume", creator: "CapitalCV" });
    const pageWpt = pdf.internal.pageSize.getWidth();
    const pageHpt = pdf.internal.pageSize.getHeight();
    const k = pageWpt / pageW;

    const runs = collectTextRuns(sheet);
    // Sharp text on long documents without exceeding canvas size limits.
    const scale = pages > 6 ? 2 : 2.5;

    for (let page = 0; page < pages; page += 1) {
      const canvas = await html2canvas(sheet, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        x: 0,
        y: page * pageH,
        width: pageW,
        height: pageH,
        windowWidth: pageW,
      });

      if (page > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWpt, pageHpt, undefined, "FAST");

      // Invisible text over the picture: selectable, searchable, parseable.
      pdf.setFont("helvetica", "normal");
      for (const run of runs) {
        if (run.y < page * pageH || run.y >= (page + 1) * pageH) continue;
        const text = toWinAnsi(run.text);
        if (!text.trim()) continue;

        pdf.setFontSize(run.fontPx * k);
        // Stretch the run to the width it occupies on the page with horizontal
        // scaling, not extra character spacing: spacing opens gaps that text
        // extractors (and ATS parsers) read as spaces — "W O R K".
        const natural = pdf.getTextWidth(text);
        const scale = natural > 0 ? (run.width * k) / natural : 1;
        pdf.text(text, run.x * k, (run.y - page * pageH) * k, {
          baseline: "top",
          renderingMode: "invisible",
          horizontalScale: Math.min(3, Math.max(0.3, Number.isFinite(scale) ? scale : 1)),
        });
      }

      onProgress?.((page + 1) / pages);
    }

    return { blob: pdf.output("blob"), pages };
  } finally {
    mounted.dispose();
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function downloadResumePdf(
  doc: SheetDoc,
  title: string,
  options?: PdfOptions,
): Promise<void> {
  const name = doc.content.personal.fullName || title;
  const { blob } = await buildResumePdf(doc, title, options);
  saveBlob(blob, resumeFilename(name));
}

/* -------------------------------------------------------------------- print */

/**
 * Print the résumé through the browser's own print dialog (real vector text;
 * "Save as PDF" there also works). A temporary root is made visible only to
 * `@media print`, with the page size matching the chosen paper.
 */
/** Tears down the previous print, if the browser never said it finished. */
let finishPrint: (() => void) | null = null;

export async function printResume(doc: SheetDoc, title: string): Promise<void> {
  finishPrint?.();

  const host = document.createElement("div");
  host.id = "cv-print-root";
  document.body.appendChild(host);

  const { pageSize } = doc.design;
  const style = document.createElement("style");
  style.id = "cv-print-style";
  style.textContent = `
    @page { size: ${pageSize === "letter" ? "letter" : "A4"}; margin: 0; }
    #cv-print-root { display: none; }
    @media print {
      body > *:not(#cv-print-root) { display: none !important; }
      #cv-print-root { display: block !important; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    }`;
  document.head.appendChild(style);

  const previousTitle = document.title;
  document.title = title;

  let mounted: Mounted | null = null;
  // `afterprint` is not fired everywhere (some mobile browsers, headless
  // Chrome), so also listen for the print media query switching off, and
  // clear up any leftover before the next print.
  const printQuery = window.matchMedia("print");
  const onQuery = (event: MediaQueryListEvent) => {
    if (!event.matches) cleanup();
  };
  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    printQuery.removeEventListener("change", onQuery);
    window.removeEventListener("pointerdown", cleanup, true);
    window.removeEventListener("keydown", cleanup, true);
    if (finishPrint === cleanup) finishPrint = null;
    document.title = previousTitle;
    mounted?.dispose();
    mounted = null;
    host.remove();
    style.remove();
  };
  finishPrint = cleanup;

  try {
    // Measure while visible-but-off-screen; print CSS then takes over.
    host.style.cssText = `position:fixed;top:0;left:-${sheetMetrics(doc).pageW + 400}px;`;
    mounted = await mountSheet(doc, host);
    host.style.cssText = "";

    // Browsers lay out A4 at 793.7 × 1122.5px, a hair short of our 794 × 1123,
    // so a sheet of exactly N pages would spill a blank page. Trim it.
    if (pageSize === "a4") {
      mounted.sheet.style.width = "210mm";
      mounted.sheet.style.height = `calc(${mounted.pages} * 297mm - 1.5px)`;
      mounted.sheet.style.overflow = "hidden";
    }

    window.addEventListener("afterprint", cleanup);
    printQuery.addEventListener("change", onQuery);
    // Let layout settle, then hand over to the browser.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    window.print();
    // The print dialog is modal: the next click or key press means it has
    // closed, even in browsers that never send `afterprint`.
    window.addEventListener("pointerdown", cleanup, true);
    window.addEventListener("keydown", cleanup, true);
  } catch (error) {
    cleanup();
    throw error;
  }
}
