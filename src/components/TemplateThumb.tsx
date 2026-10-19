import { useEffect, useRef, useState } from "react";

import ResumeSheet, { sheetMetrics } from "../resume/ResumeSheet";
import type { SheetDoc } from "../resume/ResumeSheet";

/**
 * A scaled-down, non-interactive render of the real template — the gallery
 * and dashboard show the actual design, not a drawing of it. Only the first
 * page is shown.
 */
export default function TemplateThumb({ doc }: { doc: SheetDoc }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const { pageW, pageH } = sheetMetrics(doc);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const scale = width / pageW;

  return (
    <div
      ref={frame}
      className="thumb"
      aria-hidden="true"
      style={{ aspectRatio: `${pageW} / ${pageH}` }}
    >
      {width > 0 && (
        <div className="thumb-stage" style={{ width: pageW, transform: `scale(${scale})` }}>
          <ResumeSheet doc={doc} />
        </div>
      )}
    </div>
  );
}
