import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { loadFonts } from "../resume/fonts";
import { paginate } from "../resume/paginate";
import ResumeSheet, { sheetMetrics } from "../resume/ResumeSheet";
import type { SheetDoc } from "../resume/ResumeSheet";

interface PreviewProps {
  doc: SheetDoc;
  /** 1 = actual size (794px wide for A4). */
  zoom: number;
  onPageCount?: (pages: number) => void;
  /** Dashed page-boundary guides between pages. */
  guides?: boolean;
}

/**
 * The live, paginated preview. It renders the same `ResumeSheet` the PDF
 * exporter rasterises, then runs `paginate()` so the page breaks you see here
 * are the ones in the download.
 */
export default function ResumePreview({ doc, zoom, onPageCount, guides = true }: PreviewProps) {
  // Typing stays responsive; layout follows a frame behind when it has to.
  const shown = useDeferredValue(doc);
  const metrics = sheetMetrics(shown);
  const stageRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);

  const { pageH, margin } = metrics;
  const fontKey = metrics.fonts.join("|");

  const layout = useCallback(() => {
    const sheet = stageRef.current?.querySelector<HTMLElement>(".rt");
    if (!sheet) return;
    const count = paginate(sheet, { pageHeight: pageH, margin });
    if (count !== null) setPages((previous) => (previous === count ? previous : count));
  }, [pageH, margin]);

  useLayoutEffect(() => {
    layout();
  }, [shown, layout]);

  // Metrics change when a webfont arrives; lay out again once it has.
  useEffect(() => {
    let alive = true;
    void loadFonts(fontKey.split("|")).then(() => alive && layout());
    const onLoaded = () => layout();
    document.fonts?.addEventListener("loadingdone", onLoaded);
    return () => {
      alive = false;
      document.fonts?.removeEventListener("loadingdone", onLoaded);
    };
  }, [fontKey, layout]);

  // Becoming visible (a tab switch on mobile, a modal opening) changes the
  // stage's size from zero; lay out again then.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let wasHidden = stage.offsetWidth === 0;
    const observer = new ResizeObserver(() => {
      const hidden = stage.offsetWidth === 0;
      if (wasHidden && !hidden) layout();
      wasHidden = hidden;
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [layout]);

  useEffect(() => {
    onPageCount?.(pages);
  }, [pages, onPageCount]);

  return (
    <div
      className="rp"
      style={{ width: metrics.pageW * zoom, height: pages * pageH * zoom }}
    >
      <div
        ref={stageRef}
        className="rp-stage"
        style={{ width: metrics.pageW, transform: `scale(${zoom})` }}
      >
        <ResumeSheet doc={shown} />
        {guides &&
          pages > 1 &&
          Array.from({ length: pages - 1 }, (_, i) => (
            <div key={i} className="rp-guide" style={{ top: (i + 1) * pageH }}>
              <span>Page {i + 2}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
