import { useMemo } from "react";
import { CheckCircleFilled, SearchOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Segmented, Tag } from "antd";

import { CATEGORIES, CATEGORY_LABELS, TEMPLATES } from "../resume/registry";
import type { TemplateSpec } from "../resume/registry";
import { SAMPLE_CONTENT } from "../resume/sampleData";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCategory, setQuery } from "../store/slices/templateSlice";
import type { DesignSettings, ResumeContent, SectionConfig } from "../types/resume";
import { DEFAULT_DESIGN, defaultSections } from "../types/resume";
import TemplateThumb from "./TemplateThumb";

interface Props {
  /** Called when a template card is chosen. */
  onSelect: (templateId: string) => void;
  selectedId?: string;
  /** Render with this content (default: a fictional sample résumé). */
  content?: ResumeContent;
  design?: DesignSettings;
  sections?: SectionConfig[];
  actionLabel?: string;
  /** Fewer columns, for use in a modal or drawer. */
  compact?: boolean;
}

export function matchesFilter(spec: TemplateSpec, category: string, query: string) {
  if (category !== "all" && !spec.categories.includes(category as never)) return false;
  const q = query.trim().toLowerCase();
  return !q || spec.name.toLowerCase().includes(q) || spec.tagline.toLowerCase().includes(q);
}

/**
 * The template gallery: real renders of every design, filterable by category.
 * Filter state lives in Redux (and is persisted) so it survives navigation.
 */
export default function TemplateGallery({
  onSelect,
  selectedId,
  content = SAMPLE_CONTENT,
  design = DEFAULT_DESIGN,
  sections,
  actionLabel = "Use this template",
  compact = false,
}: Props) {
  const dispatch = useAppDispatch();
  const { category, query } = useAppSelector((state) => state.template);
  const resolvedSections = useMemo(() => sections ?? defaultSections(), [sections]);

  const visible = useMemo(
    () => TEMPLATES.filter((spec) => matchesFilter(spec, category, query)),
    [category, query],
  );

  return (
    <div className="gallery">
      <div className="gallery__filters">
        <Segmented
          className="gallery__categories"
          value={category}
          onChange={(value) => dispatch(setCategory(value as typeof category))}
          options={[
            { label: "All", value: "all" },
            ...CATEGORIES.map((c) => ({ label: CATEGORY_LABELS[c], value: c })),
          ]}
          aria-label="Filter templates by category"
        />
        <Input
          allowClear
          className="gallery__search"
          prefix={<SearchOutlined />}
          placeholder="Search by city"
          value={query}
          onChange={(e) => dispatch(setQuery(e.target.value))}
          aria-label="Search templates"
        />
      </div>

      <p className="gallery__count" role="status" aria-live="polite">
        {visible.length} of {TEMPLATES.length} templates
      </p>

      {visible.length === 0 ? (
        <Empty description="No templates match that filter" />
      ) : (
        <ul className={`gallery__grid${compact ? " gallery__grid--compact" : ""}`}>
          {visible.map((spec) => {
            const selected = spec.id === selectedId;
            return (
              <li key={spec.id}>
                <div className={`tcard${selected ? " tcard--selected" : ""}`}>
                  <button
                    type="button"
                    className="tcard__preview"
                    onClick={() => onSelect(spec.id)}
                    aria-label={`${actionLabel}: ${spec.name}`}
                    aria-pressed={selectedId ? selected : undefined}
                  >
                    <TemplateThumb
                      doc={{ templateId: spec.id, content, design, sections: resolvedSections }}
                    />
                    {selected && (
                      <span className="tcard__check">
                        <CheckCircleFilled /> Selected
                      </span>
                    )}
                  </button>
                  <div className="tcard__body">
                    <div className="tcard__title">
                      <h3>{spec.name}</h3>
                      {spec.atsFriendly && <Tag color="green">ATS</Tag>}
                    </div>
                    <p>{spec.tagline}</p>
                    <div className="tcard__tags">
                      {spec.categories
                        .filter((c) => c !== "ats")
                        .slice(0, 2)
                        .map((c) => (
                          <Tag key={c}>{CATEGORY_LABELS[c]}</Tag>
                        ))}
                    </div>
                    {!compact && (
                      <Button
                        block
                        type={selected ? "default" : "primary"}
                        onClick={() => onSelect(spec.id)}
                      >
                        {selected ? "Selected" : actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
