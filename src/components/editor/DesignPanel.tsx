import { CheckOutlined } from "@ant-design/icons";
import { Button, ColorPicker, Form, Segmented, Select, Slider, Switch } from "antd";

import { FONTS } from "../../resume/fonts";
import { getTemplate } from "../../resume/registry";
import type { DesignSettings, Margin, PageSize, Spacing } from "../../types/resume";
import { PAGE_SIZES } from "../../types/resume";

const SWATCHES = [
  "#1b2a4e", "#1d4ed8", "#0369a1", "#0d9488", "#0b6e4f",
  "#4d7c0f", "#b45309", "#c2410c", "#a4161a", "#7a2e3a",
  "#6d28d9", "#374151",
];

interface Props {
  templateId: string;
  design: DesignSettings;
  onChange: (recipe: (design: DesignSettings) => void) => void;
  onChangeTemplate: () => void;
}

export default function DesignPanel({ templateId, design, onChange, onChangeTemplate }: Props) {
  const spec = getTemplate(templateId);
  const accent = design.accent ?? spec.accent;
  const size = design.fontSize ?? spec.fontSize;

  return (
    <Form layout="vertical" component={false} className="design-panel">
      <Form.Item label="Template">
        <div className="design-panel__template">
          <div>
            <strong>{spec.name}</strong>
            <div className="muted">{spec.tagline}</div>
          </div>
          <Button onClick={onChangeTemplate}>Change</Button>
        </div>
      </Form.Item>

      <Form.Item
        label="ATS-friendly mode"
        extra="Plain single-column layout with standard headings and no decoration — the safest format for applicant-tracking systems."
      >
        <Switch
          checked={design.ats}
          onChange={(checked) => onChange((d) => void (d.ats = checked))}
          aria-label="ATS-friendly mode"
        />
      </Form.Item>

      <Form.Item label="Accent colour">
        <div className="swatches" role="group" aria-label="Accent colour">
          {SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              className="swatch"
              style={{ background: color }}
              aria-label={`Use ${color}`}
              aria-pressed={design.accent?.toLowerCase() === color}
              onClick={() => onChange((d) => void (d.accent = color))}
            >
              {design.accent?.toLowerCase() === color && <CheckOutlined />}
            </button>
          ))}
          <ColorPicker
            value={accent}
            disabledAlpha
            onChangeComplete={(color) => onChange((d) => void (d.accent = color.toHexString().slice(0, 7)))}
          />
          <Button size="small" type="link" disabled={!design.accent} onClick={() => onChange((d) => void (d.accent = null))}>
            Template default
          </Button>
        </div>
      </Form.Item>

      <Form.Item label="Font" htmlFor="design-font">
        <Select
          id="design-font"
          style={{ width: "100%" }}
          value={design.fontKey ?? "template"}
          onChange={(value) => onChange((d) => void (d.fontKey = value === "template" ? null : value))}
          options={[
            { value: "template", label: "Template default" },
            ...FONTS.map((f) => ({
              value: f.key,
              label: <span style={{ fontFamily: f.stack }}>{f.label}</span>,
            })),
          ]}
        />
      </Form.Item>

      <Form.Item label={`Font size — ${size}px`}>
        <Slider
          min={10}
          max={15}
          step={0.5}
          value={size}
          onChange={(value) => onChange((d) => void (d.fontSize = value))}
          ariaLabelForHandle="Font size"
        />
        {design.fontSize !== null && (
          <Button size="small" type="link" onClick={() => onChange((d) => void (d.fontSize = null))}>
            Template default
          </Button>
        )}
      </Form.Item>

      <Form.Item label="Spacing">
        <Segmented<Spacing>
          block
          aria-label="Spacing"
          value={design.spacing}
          onChange={(value) => onChange((d) => void (d.spacing = value))}
          options={[
            { label: "Compact", value: "compact" },
            { label: "Normal", value: "normal" },
            { label: "Relaxed", value: "relaxed" },
          ]}
        />
      </Form.Item>

      <Form.Item label="Page margins">
        <Segmented<Margin>
          block
          aria-label="Page margins"
          value={design.margin}
          onChange={(value) => onChange((d) => void (d.margin = value))}
          options={[
            { label: "Narrow", value: "narrow" },
            { label: "Normal", value: "normal" },
            { label: "Wide", value: "wide" },
          ]}
        />
      </Form.Item>

      <Form.Item label="Page size">
        <Segmented<PageSize>
          block
          aria-label="Page size"
          value={design.pageSize}
          onChange={(value) => onChange((d) => void (d.pageSize = value))}
          options={(Object.keys(PAGE_SIZES) as PageSize[]).map((key) => ({
            label: PAGE_SIZES[key].label,
            value: key,
          }))}
        />
      </Form.Item>
    </Form>
  );
}
