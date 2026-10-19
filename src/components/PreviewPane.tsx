import { useEffect, useRef, useState } from "react";
import {
  ColumnWidthOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, Select, Space, Tag, Tooltip } from "antd";
import type { ReactNode } from "react";

import type { SheetDoc } from "../resume/ResumeSheet";
import { PAGE_SIZES } from "../types/resume";
import ResumePreview from "./ResumePreview";

const STEPS = [0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25, 1.5];

interface Props {
  doc: SheetDoc;
  /** Extra controls, on the left of the toolbar. */
  extra?: ReactNode;
}

/** Zoomable, paginated preview with page count — used inline and fullscreen. */
export default function PreviewPane({ doc, extra }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [mode, setMode] = useState<"fit" | number>("fit");
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const pageWidth = PAGE_SIZES[doc.design.pageSize].width;
  const fit = Math.min(1.5, Math.max(0.25, (width - 32) / pageWidth));
  const zoom = mode === "fit" ? fit : mode;

  const step = (direction: 1 | -1) => {
    const next =
      direction === 1
        ? STEPS.find((s) => s > zoom + 0.01)
        : [...STEPS].reverse().find((s) => s < zoom - 0.01);
    if (next) setMode(next);
  };

  return (
    <div className="pane">
      <div className="pane__bar">
        <Space size={8} wrap>
          {extra}
          <Tag color={pages > 1 ? "blue" : undefined} role="status">
            {pages} {pages === 1 ? "page" : "pages"}
          </Tag>
        </Space>
        <Space size={4}>
          <Tooltip title="Zoom out">
            <Button
              size="small"
              icon={<ZoomOutOutlined />}
              aria-label="Zoom out"
              disabled={zoom <= STEPS[0] + 0.01}
              onClick={() => step(-1)}
            />
          </Tooltip>
          <Select
            size="small"
            style={{ width: 104 }}
            value={mode === "fit" ? "fit" : mode}
            aria-label="Zoom level"
            onChange={(value: "fit" | number) => setMode(value)}
            options={[
              { value: "fit", label: `Fit ${Math.round(fit * 100)}%` },
              ...STEPS.map((s) => ({ value: s, label: `${Math.round(s * 100)}%` })),
            ]}
          />
          <Tooltip title="Zoom in">
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              aria-label="Zoom in"
              disabled={zoom >= STEPS[STEPS.length - 1] - 0.01}
              onClick={() => step(1)}
            />
          </Tooltip>
          <Tooltip title="Fit to width">
            <Button
              size="small"
              icon={<ColumnWidthOutlined />}
              aria-label="Fit to width"
              type={mode === "fit" ? "primary" : "default"}
              onClick={() => setMode("fit")}
            />
          </Tooltip>
        </Space>
      </div>
      <div className="pane__scroll" ref={scroller} tabIndex={0} aria-label="Resume preview">
        <div className="pane__sheet">
          <ResumePreview doc={doc} zoom={zoom} onPageCount={setPages} />
        </div>
      </div>
    </div>
  );
}
