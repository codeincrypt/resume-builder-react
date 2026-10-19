/**
 * Page breaking for a continuous résumé sheet.
 *
 * The sheet is laid out as one tall column; this pass walks every
 * `[data-block]` (an entry, the summary, a skill group, the header…) in
 * document order and, if a block would straddle a page boundary, pushes it to
 * the top of the next page with `margin-top`. Nothing is ever cut in half and
 * nothing overlaps, in the preview *and* in the exported PDF, because both
 * slice the same laid-out sheet at the same page height.
 *
 * Columns flow independently (a side rail is its own flex column), so each is
 * paginated by its own blocks and the sheet grows to fit the longest.
 *
 * Rules, in order:
 *  - `[data-pagebreak]` sections always start a page.
 *  - The first block of a section drags the whole section (so a heading is
 *    never stranded at the foot of a page).
 *  - An entry taller than a third of a page may split between bullets
 *    (`data-splittable`), keeping its header with the first bullet.
 *  - A block taller than a whole page is left alone — it cannot fit anywhere.
 */

const PUSHED = "data-pushed";

export interface PaginateOptions {
  pageHeight: number;
  /** Top/bottom page margin, px. */
  margin: number;
}

interface Item {
  el: HTMLElement;
  /** What actually moves: the block, or its section/entry when it comes first. */
  anchor: HTMLElement;
  forced: boolean;
}

function clear(sheet: HTMLElement) {
  sheet.querySelectorAll<HTMLElement>(`[${PUSHED}]`).forEach((el) => {
    el.style.marginTop = "";
    el.removeAttribute(PUSHED);
  });
  sheet.style.height = "";
}

function sectionAnchor(block: HTMLElement): HTMLElement {
  const section = block.closest<HTMLElement>(".rt-sec");
  return section && section.querySelector("[data-block]") === block ? section : block;
}

/**
 * Lay out page breaks inside `sheet` and return the page count, or null if
 * the sheet is not currently laid out (hidden). The sheet must be mounted and
 * its fonts loaded; call again after any content change.
 */
export function paginate(sheet: HTMLElement, { pageHeight, margin }: PaginateOptions): number | null {
  // A hidden sheet (display: none — e.g. the preview tab on a phone while
  // editing) measures as zero. Leave it untouched; lay it out once visible.
  if (sheet.offsetWidth === 0) return null;
  clear(sheet);

  // The sheet may be shown under a CSS transform (zoom); all measurements are
  // divided back into the sheet's own, unscaled pixel space.
  const scale = sheet.offsetWidth > 0 ? sheet.getBoundingClientRect().width / sheet.offsetWidth : 1;
  const top0 = () => sheet.getBoundingClientRect().top;
  const px = (value: number) => value / scale;

  const usable = pageHeight - 2 * margin;
  const items: Item[] = [];

  sheet.querySelectorAll<HTMLElement>("[data-block], [data-pagebreak]").forEach((el) => {
    if (el.hasAttribute("data-pagebreak")) {
      items.push({ el, anchor: el, forced: true });
      return;
    }
    const height = px(el.getBoundingClientRect().height);
    if (el.hasAttribute("data-splittable") && height > pageHeight / 3) {
      el.querySelectorAll<HTMLElement>("li").forEach((li, i) =>
        items.push({ el: li, anchor: i === 0 ? sectionAnchor(el) : li, forced: false }),
      );
      return;
    }
    items.push({ el, anchor: sectionAnchor(el), forced: false });
  });

  for (const { el, anchor, forced } of items) {
    const base = top0();
    const top = px(anchor.getBoundingClientRect().top - base);
    const bottom = px(el.getBoundingClientRect().bottom - base);
    const page = Math.max(0, Math.floor(top / pageHeight + 1e-6));
    const pageTop = page === 0 ? 0 : page * pageHeight + margin;
    const pageBottom = (page + 1) * pageHeight - margin;
    const nextTop = (page + 1) * pageHeight + margin;

    let shift = 0;
    if (forced) {
      if (top > pageTop + 2) shift = nextTop - top;
    } else if (bottom - top > usable) {
      continue;
    } else if (bottom > pageBottom + 0.5) {
      shift = nextTop - top;
    } else if (page > 0 && top < pageTop - 0.5) {
      shift = pageTop - top;
    }

    if (shift > 0.5) {
      const current = parseFloat(getComputedStyle(anchor).marginTop) || 0;
      anchor.style.marginTop = `${current + shift}px`;
      anchor.setAttribute(PUSHED, "");
    }
  }

  const pages = Math.max(1, Math.ceil((sheet.offsetHeight - 0.5) / pageHeight));
  sheet.style.height = `${pages * pageHeight}px`;
  return pages;
}
