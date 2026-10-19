import type { PDFDocumentProxy } from "pdfjs-dist";

import type { FileKind } from "./files";

/**
 * Text extraction — conventional, local and LLM-free:
 *  - PDF  : pdf.js text layer, reassembled into lines.
 *  - scan : if a PDF has no real text layer, render each page and OCR it with
 *           Tesseract (WebAssembly, in the browser).
 *  - DOCX : mammoth -> HTML -> lines (keeps bullets and tables).
 *  - TXT  : read as UTF-8.
 *
 * Everything runs in the user's browser; the document is not sent anywhere.
 */

export interface ExtractProgress {
  stage: "reading" | "ocr";
  /** 0–1 */
  fraction: number;
  message: string;
}

export interface Extracted {
  text: string;
  method: "pdf" | "ocr" | "docx" | "txt";
  pages: number;
  warnings: string[];
}

type OnProgress = (progress: ExtractProgress) => void;

/** Fewer characters per page than this means there is no usable text layer. */
const MIN_CHARS_PER_PAGE = 40;
const MAX_PDF_PAGES = 15;

export async function extractText(
  file: File,
  kind: FileKind,
  onProgress?: OnProgress,
): Promise<Extracted> {
  onProgress?.({ stage: "reading", fraction: 0.05, message: "Reading your file…" });
  switch (kind) {
    case "txt":
      return extractTxt(file);
    case "docx":
      return extractDocx(file, onProgress);
    case "pdf":
      return extractPdf(file, onProgress);
  }
}

/* --------------------------------------------------------------------- txt */

async function extractTxt(file: File): Promise<Extracted> {
  const text = (await file.text()).replace(/^\uFEFF/, "");
  const warnings: string[] = [];
  if ((text.match(/�/g) ?? []).length > 5) {
    warnings.push(
      "Some characters could not be decoded. Save the file as UTF-8 for best results.",
    );
  }
  return { text, method: "txt", pages: 1, warnings };
}

/* -------------------------------------------------------------------- docx */

const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "DIV"]);

function textOf(node: Element): string {
  // <br> inside a paragraph is a line break, not a space.
  const clone = node.cloneNode(true) as Element;
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return (clone.textContent ?? "").replace(/[ \t\u00A0]+/g, " ").trim();
}

function walkHtml(parent: Element, out: string[]) {
  for (const child of Array.from(parent.children)) {
    if (child.tagName === "UL" || child.tagName === "OL") {
      for (const li of Array.from(child.children)) {
        if (li.tagName !== "LI") continue;
        // Nested lists are walked separately so their items stay bullets.
        const own = li.cloneNode(true) as Element;
        own.querySelectorAll("ul, ol").forEach((n) => n.remove());
        const text = textOf(own);
        if (text) out.push(`• ${text}`);
        li.querySelectorAll(":scope > ul, :scope > ol").forEach((nested) =>
          walkHtml(nested.parentElement as Element, out),
        );
      }
    } else if (child.tagName === "TABLE") {
      for (const row of Array.from(child.querySelectorAll("tr"))) {
        const cells = Array.from(row.children)
          .map((cell) => textOf(cell))
          .filter(Boolean);
        if (cells.length) out.push(cells.join(" | "));
      }
      out.push("");
    } else if (BLOCK_TAGS.has(child.tagName)) {
      if (child.tagName === "DIV" && child.children.length > 0) {
        walkHtml(child, out);
      } else {
        const text = textOf(child);
        out.push(...(text ? text.split("\n") : [""]));
      }
    }
  }
}

async function extractDocx(file: File, onProgress?: OnProgress): Promise<Extracted> {
  const mammoth = await import("mammoth");
  onProgress?.({ stage: "reading", fraction: 0.3, message: "Reading Word document…" });

  const { value: html, messages } = await mammoth.convertToHtml({
    arrayBuffer: await file.arrayBuffer(),
  });

  // DOMParser builds an inert document: nothing in it executes or loads.
  const doc = new DOMParser().parseFromString(html, "text/html");
  const lines: string[] = [];
  walkHtml(doc.body, lines);

  const warnings = messages
    .filter((m) => m.type === "error")
    .map((m) => m.message)
    .slice(0, 2);

  const text = lines.join("\n");
  if (text.replace(/\s/g, "").length < 40) {
    warnings.push(
      "Very little text was found. If your resume uses text boxes, save it as a PDF and upload that instead.",
    );
  }
  return { text, method: "docx", pages: 1, warnings };
}

/* --------------------------------------------------------------------- pdf */

interface PdfItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

export interface TextLine {
  text: string;
  x0: number;
  x1: number;
  /** Baseline, in PDF space (grows upwards). */
  y: number;
  height: number;
  /** A gap well beyond normal leading precedes this line. */
  breakBefore: boolean;
}

/**
 * Rebuild lines from pdf.js text items. Items arrive in content-stream order,
 * which for generated PDFs follows the author's reading order — including
 * multi-column layouts, where each column is drawn in turn. Sorting purely by
 * position would instead splice the columns together line by line, so items
 * are merged only while they continue the same baseline moving rightwards.
 */
export function buildLines(items: PdfItem[]): TextLine[] {
  const lines: TextLine[] = [];
  let current: TextLine | null = null;

  for (const item of items) {
    if (!item.str) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const height = item.height || Math.abs(item.transform[3]) || 10;
    const tolerance = Math.max(2, height * 0.4);

    if (current && Math.abs(y - current.y) <= tolerance && x >= current.x1 - tolerance) {
      const gap = x - current.x1;
      const needsSpace =
        gap > height * 0.2 && !current.text.endsWith(" ") && !item.str.startsWith(" ");
      current.text += (needsSpace ? " " : "") + item.str;
      current.x1 = Math.max(current.x1, x + item.width);
      current.height = Math.max(current.height, height);
    } else {
      current = { text: item.str, x0: x, x1: x + item.width, y, height, breakBefore: false };
      lines.push(current);
    }
  }

  const out: TextLine[] = [];
  let previous: TextLine | null = null;
  for (const line of lines) {
    const text = line.text.replace(/[ \t]+/g, " ").trim();
    if (!text) continue;
    const breakBefore =
      !!previous && previous.y - line.y > Math.max(previous.height, line.height) * 1.9;
    out.push({ ...line, text, breakBefore });
    previous = line;
  }
  return out;
}

function toText(lines: TextLine[]): string[] {
  const out: string[] = [];
  lines.forEach((line, i) => {
    if (line.breakBefore && i > 0) out.push("");
    out.push(line.text);
  });
  return out;
}

export function linesFromItems(items: PdfItem[]): string[] {
  return toText(buildLines(items));
}

interface PageLines {
  lines: TextLine[];
  width: number;
}

/**
 * Find a vertical gutter shared by the document's pages: an x position, in the
 * middle half of the page, that (almost) no line crosses while both sides hold
 * a real share of the text. That is a two-column résumé.
 */
export function findGutter(pages: PageLines[]): number | null {
  const all = pages.flatMap((p) => p.lines);
  const width = Math.max(...pages.map((p) => p.width), 1);
  if (all.length < 12) return null;

  const BIN = 2;
  const coverage = new Array(Math.ceil(width / BIN) + 1).fill(0);
  for (const line of all) {
    for (let b = Math.floor(line.x0 / BIN); b <= Math.floor(line.x1 / BIN); b += 1) {
      if (b >= 0 && b < coverage.length) coverage[b] += 1;
    }
  }

  const limit = Math.max(1, Math.floor(all.length * 0.03));
  const from = Math.floor((width * 0.25) / BIN);
  const to = Math.ceil((width * 0.75) / BIN);
  let best = { start: -1, length: 0 };
  let run = { start: -1, length: 0 };
  for (let b = from; b <= to; b += 1) {
    if (coverage[b] <= limit) {
      run = run.start === -1 ? { start: b, length: 1 } : { start: run.start, length: run.length + 1 };
      if (run.length > best.length) best = { ...run };
    } else {
      run = { start: -1, length: 0 };
    }
  }
  if (best.length * BIN < 10) return null;

  const gutter = (best.start + best.length / 2) * BIN;
  const left = all.filter((l) => l.x1 <= gutter + 1).length;
  const right = all.filter((l) => l.x0 >= gutter - 1).length;
  const share = all.length * 0.15;
  if (left < 5 || right < 5 || left < share || right < share) return null;
  return gutter;
}

/**
 * Linearise a two-column document: each column top to bottom across every
 * page, starting with the column that holds the name (the largest text on the
 * first page). Without this, a main column that continues onto page 2 would
 * be read *after* page 1's side column and land in its last section.
 */
export function orderByColumns(pages: PageLines[], gutter: number): string[] {
  type Placed = TextLine & { page: number };
  const left: Placed[] = [];
  const right: Placed[] = [];
  pages.forEach((page, index) => {
    for (const line of page.lines) {
      (line.x0 >= gutter - 1 ? right : left).push({ ...line, page: index });
    }
  });

  // Paragraph breaks are re-derived inside each column: neighbours in the
  // source order may have come from the other column. A line *above* its
  // predecessor is not a break — that is a right-aligned date on the title's
  // baseline, drawn after the company line.
  const withBreaks = (column: Placed[]): TextLine[] =>
    column.map((line, i) => {
      const prev = column[i - 1];
      const gap = prev && prev.page === line.page ? prev.y - line.y : 0;
      return {
        ...line,
        breakBefore:
          !!prev && (prev.page !== line.page || gap > Math.max(prev.height, line.height) * 1.9),
      };
    });

  const first = pages[0]?.lines ?? [];
  const name = first.reduce<TextLine | null>(
    (best, line) => (!best || line.height > best.height + 0.5 ? line : best),
    null,
  );
  const nameOnRight = !!name && name.x0 >= gutter - 1;
  const [a, b] = nameOnRight ? [right, left] : [left, right];
  return [...toText(withBreaks(a)), "", ...toText(withBreaks(b))];
}

interface OcrBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrLine {
  bbox: OcrBox;
  /** Tesseract's baseline; steadier than the box bottom, which moves with descenders. */
  baseline?: OcrBox;
  words: { text: string; bbox: OcrBox }[];
}

/**
 * Lines from Tesseract's word boxes, split wherever words sit far apart.
 * Tesseract happily reads straight across two columns ("SUMMARY   SKILLS");
 * splitting at wide gaps gives the column logic above separate pieces to sort.
 * Coordinates are flipped so `y` grows upwards, as in PDF space.
 */
export function linesFromOcr(lines: OcrLine[], pageWidth: number, pageHeight: number): TextLine[] {
  const minGap = pageWidth * 0.035;
  const segments: TextLine[] = [];

  for (const line of lines) {
    const words = line.words.filter((w) => w.text.trim()).sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const height = Math.max(1, line.bbox.y1 - line.bbox.y0);
    const baseline = line.baseline ? (line.baseline.y0 + line.baseline.y1) / 2 : line.bbox.y1;
    let run: typeof words = [];
    const flush = () => {
      if (run.length === 0) return;
      segments.push({
        text: run.map((w) => w.text.trim()).join(" "),
        x0: run[0].bbox.x0,
        x1: run[run.length - 1].bbox.x1,
        y: pageHeight - baseline,
        height,
        breakBefore: false,
      });
      run = [];
    };
    for (const word of words) {
      const prev = run[run.length - 1];
      if (prev && word.bbox.x0 - prev.bbox.x1 > Math.max(minGap, height * 2.5)) flush();
      run.push(word);
    }
    flush();
  }

  segments.sort((a, b) => b.y - a.y || a.x0 - b.x0);
  return segments.map((line, i) => {
    const prev = segments[i - 1];
    return {
      ...line,
      breakBefore: !!prev && prev.y - line.y > Math.max(prev.height, line.height) * 1.9,
    };
  });
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  return pdfjs;
}

async function extractPdf(file: File, onProgress?: OnProgress): Promise<Extracted> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data }).promise;
  } catch (error) {
    const name = (error as { name?: string }).name;
    if (name === "PasswordException") {
      throw new Error("This PDF is password-protected. Remove the password and try again.");
    }
    throw new Error("This PDF could not be read. It may be damaged — try exporting it again.");
  }

  const warnings: string[] = [];
  const total = Math.min(pdf.numPages, MAX_PDF_PAGES);
  if (pdf.numPages > MAX_PDF_PAGES) {
    warnings.push(`Only the first ${MAX_PDF_PAGES} of ${pdf.numPages} pages were read.`);
  }

  const pages: PageLines[] = [];
  for (let n = 1; n <= total; n += 1) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    pages.push({
      lines: buildLines(content.items as unknown as PdfItem[]),
      width: page.getViewport({ scale: 1 }).width,
    });
    onProgress?.({
      stage: "reading",
      fraction: 0.1 + 0.6 * (n / total),
      message: `Reading page ${n} of ${total}…`,
    });
  }

  const gutter = findGutter(pages);
  const text = gutter
    ? orderByColumns(pages, gutter).join("\n")
    : pages.map((page) => toText(page.lines).join("\n")).join("\n\n");
  const chars = text.replace(/\s/g, "").length;

  if (chars >= MIN_CHARS_PER_PAGE * total) {
    return { text, method: "pdf", pages: total, warnings };
  }

  // No usable text layer: this is a scan. Fall back to OCR.
  warnings.push("This looks like a scanned document, so it was read with OCR — check the text carefully.");
  const ocrText = await ocrPdf(pdf, total, onProgress);
  return { text: ocrText, method: "ocr", pages: total, warnings };
}

/**
 * Tesseract reads dark text on a light ground. Résumés often set the name in
 * white on a coloured banner or rail, so invert every tile whose *background*
 * is dark before recognition. The background is the tile's median luminance —
 * text is the minority of a tile's pixels — so large white lettering cannot
 * make a banner tile look light and leave a half-inverted patchwork.
 */
function invertDarkRegions(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  const { width, height } = canvas;
  const image = context.getImageData(0, 0, width, height);
  const px = image.data;
  const TILE = 32;
  const histogram = new Uint32Array(64);

  for (let ty = 0; ty < height; ty += TILE) {
    for (let tx = 0; tx < width; tx += TILE) {
      const yEnd = Math.min(ty + TILE, height);
      const xEnd = Math.min(tx + TILE, width);
      histogram.fill(0);
      for (let y = ty; y < yEnd; y += 1) {
        for (let x = tx; x < xEnd; x += 1) {
          const i = (y * width + x) * 4;
          histogram[(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) >> 2] += 1;
        }
      }
      const half = ((yEnd - ty) * (xEnd - tx)) / 2;
      let seen = 0;
      let median = 0;
      while (median < 63 && seen + histogram[median] < half) seen += histogram[median++];
      if (median * 4 >= 110) continue;
      for (let y = ty; y < yEnd; y += 1) {
        for (let x = tx; x < xEnd; x += 1) {
          const i = (y * width + x) * 4;
          px[i] = 255 - px[i];
          px[i + 1] = 255 - px[i + 1];
          px[i + 2] = 255 - px[i + 2];
        }
      }
    }
  }
  context.putImageData(image, 0, 0);
}

async function ocrPdf(pdf: PDFDocumentProxy, total: number, onProgress?: OnProgress): Promise<string> {
  const { createWorker } = await import("tesseract.js");

  // Language data and the WASM core are static files. By default tesseract.js
  // fetches them from a public CDN; set VITE_OCR_ASSET_PATH to self-host them
  // (see the README) so nothing at all leaves your infrastructure.
  const base = import.meta.env.VITE_OCR_ASSET_PATH as string | undefined;
  const self = base
    ? { workerPath: `${base}/worker.min.js`, corePath: base, langPath: base }
    : {};

  let pageIndex = 0;
  const worker = await createWorker("eng", 1, {
    ...self,
    logger: (m: { status: string; progress: number }) => {
      if (m.status !== "recognizing text") return;
      onProgress?.({
        stage: "ocr",
        fraction: 0.7 + 0.28 * ((pageIndex + m.progress) / total),
        message: `Recognising text on page ${pageIndex + 1} of ${total}…`,
      });
    },
  });

  try {
    const pages: PageLines[] = [];
    for (pageIndex = 0; pageIndex < total; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: 2.2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare the page for OCR.");
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      invertDarkRegions(canvas);

      const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
      const ocrLines = (data.blocks ?? []).flatMap((block) =>
        block.paragraphs.flatMap((paragraph) => paragraph.lines),
      );
      pages.push({ lines: linesFromOcr(ocrLines, canvas.width, canvas.height), width: canvas.width });
    }
    const gutter = findGutter(pages);
    return gutter
      ? orderByColumns(pages, gutter).join("\n")
      : pages.map((page) => toText(page.lines).join("\n")).join("\n\n");
  } finally {
    await worker.terminate();
  }
}
