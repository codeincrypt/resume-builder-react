import type { CSSProperties, ReactNode } from "react";

import type {
  CustomEntry,
  ResumeContent,
  SectionConfig,
} from "../types/resume";
import {
  PAGE_SIZES,
  SECTION_TITLES,
  contactItems,
  displayName,
  formatMonth,
  formatRange,
  isBuiltinSection,
  sectionHasContent,
} from "../types/resume";
import type { DesignSettings } from "../types/resume";
import { getFont } from "./fonts";
import { getTemplate } from "./registry";
import type { TemplateSpec } from "./registry";
import "./templates.css";

export interface SheetDoc {
  templateId: string;
  content: ResumeContent;
  design: DesignSettings;
  sections: SectionConfig[];
}

/* ------------------------------------------------------------------ colour */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Mix a colour toward white; resolved here because the PDF rasteriser
 *  cannot be trusted with `color-mix()`. */
function tint(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex).map((v) => Math.round(v + (255 - v) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function shade(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex).map((v) =>
    Math.round(v * factor).toString(16).padStart(2, "0"),
  );
  return `#${r}${g}${b}`;
}

/** Darken enough that accent-coloured text stays legible on white. */
function readable(hex: string): string {
  if (luminance(hex) < 0.32) return hex;
  const [r, g, b] = hexToRgb(hex).map((v) => Math.round(v * 0.72));
  return `rgb(${r}, ${g}, ${b})`;
}

/* ------------------------------------------------------------------ sizing */

const MARGIN_PX = { narrow: 34, normal: 48, wide: 64 } as const;
const SPACING = { compact: 0.78, normal: 1, relaxed: 1.28 } as const;

export function marginPx(design: DesignSettings): number {
  return MARGIN_PX[design.margin];
}

/** The template as the user is seeing it: ATS mode overrides decoration. */
export function effectiveSpec(templateId: string, ats: boolean): TemplateSpec {
  const spec = getTemplate(templateId);
  if (!ats) return spec;
  return {
    ...spec,
    layout: "single",
    header: "left",
    heading: "underline",
    entry: "inline",
    skills: "inline",
    bullet: "disc",
    round: false,
  };
}

export interface SheetMetrics {
  pageW: number;
  pageH: number;
  /** Page margin used for pagination (top and bottom), px. */
  margin: number;
  /** Font stacks the sheet needs loaded before it can be measured. */
  fonts: string[];
}

export function sheetMetrics(doc: SheetDoc): SheetMetrics {
  const spec = effectiveSpec(doc.templateId, doc.design.ats);
  const page = PAGE_SIZES[doc.design.pageSize];
  const body = getFont(doc.design.fontKey ?? spec.fontBody);
  const head = doc.design.fontKey ? body : getFont(spec.fontHead);
  return {
    pageW: page.width,
    pageH: page.height,
    margin: marginPx(doc.design),
    fonts: [...new Set([body.stack, head.stack])],
  };
}

function buildStyle(spec: TemplateSpec, design: DesignSettings): CSSProperties {
  const page = PAGE_SIZES[design.pageSize];
  const accentRaw = design.ats ? "#1f2937" : (design.accent ?? spec.accent);
  // `ink` fills banners and side rails. "accent" follows the user's accent
  // colour; unset derives a dark shade of it.
  const inkHex = design.ats
    ? "#1f2937"
    : spec.ink === "accent"
      ? accentRaw
      : (spec.ink ?? shade(accentRaw, 0.5));
  const bodyFont = getFont(design.fontKey ?? spec.fontBody);
  const headFont = design.fontKey ? bodyFont : getFont(spec.fontHead);
  const px = MARGIN_PX[design.margin];
  // Dark accents are used as-is; pale ones get darkened for text.
  const accentText = readable(accentRaw);

  return {
    "--page-w": `${page.width}px`,
    "--page-h": `${page.height}px`,
    "--accent": accentRaw,
    "--accent-text": accentText,
    "--accent-soft": tint(accentRaw, 0.86),
    "--accent-mid": tint(accentRaw, 0.6),
    "--ink": inkHex,
    "--on-ink": luminance(inkHex) > 0.5 ? "#1f2430" : "#ffffff",
    "--on-ink-muted": luminance(inkHex) > 0.5 ? "#4b5563" : "rgba(255,255,255,0.78)",
    "--on-accent": luminance(accentRaw) > 0.5 ? "#1f2430" : "#ffffff",
    "--text": design.ats ? "#111111" : (spec.text ?? "#1f2430"),
    "--muted": design.ats ? "#333333" : "#5b6573",
    "--rule": "#d5dae2",
    "--font-body": bodyFont.stack,
    "--font-head": headFont.stack,
    "--fs": `${design.fontSize ?? spec.fontSize}px`,
    "--sp": SPACING[design.spacing] * spec.density,
    "--pad-x": `${px}px`,
    "--pad-y": `${px}px`,
    "--name-size": `${spec.nameStyle?.size ?? 2.4}em`,
    "--name-weight": spec.nameStyle?.weight ?? 700,
    "--name-ls": `${spec.nameStyle?.spacing ?? 0}em`,
    "--name-tt": spec.nameStyle?.caps ? "uppercase" : "none",
    "--head-tt": spec.headCaps === false ? "none" : "uppercase",
    "--radius": spec.round ? "999px" : "2px",
    "--radius-s": spec.round ? "4px" : "0px",
  } as CSSProperties;
}

/* ------------------------------------------------------------- entry parts */

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="rt-bullets">
      {items.map((text, i) => (
        <li key={i}>{text}</li>
      ))}
    </ul>
  );
}

function Sep() {
  return (
    <span className="rt-sep" aria-hidden="true">
      {" · "}
    </span>
  );
}

function Joined({ parts }: { parts: string[] }) {
  const visible = parts.filter((p) => p.trim());
  return (
    <>
      {visible.map((part, i) => (
        <span key={i}>
          {i > 0 && <Sep />}
          {part}
        </span>
      ))}
    </>
  );
}

interface EntryProps {
  title: string;
  subtitle?: string[];
  date?: string;
  bullets?: string[];
  text?: string;
  /** Set on entries long enough that they may split across pages. */
  splittable?: boolean;
}

function Entry({ title, subtitle = [], date, bullets = [], text, splittable }: EntryProps) {
  const hasSub = subtitle.some((s) => s.trim());
  return (
    <article className="rt-entry" data-block data-splittable={splittable ? "" : undefined}>
      <div className="rt-entry-head">
        <div className="rt-entry-main">
          {title && <h3 className="rt-entry-title">{title}</h3>}
          {hasSub && (
            <div className="rt-entry-sub">
              <Joined parts={subtitle} />
            </div>
          )}
        </div>
        {date && <div className="rt-entry-date">{date}</div>}
      </div>
      {text && <p className="rt-entry-text">{text}</p>}
      <Bullets items={bullets} />
    </article>
  );
}

/* ---------------------------------------------------------------- sections */

function SectionBody({ id, content }: { id: string; content: ResumeContent }) {
  switch (id) {
    case "summary":
      return <p className="rt-summary" data-block>{content.summary}</p>;

    case "experience":
      return (
        <>
          {content.experience.map((e) => (
            <Entry
              key={e.id}
              title={e.position}
              subtitle={[e.company, e.location]}
              date={formatRange(e.startDate, e.endDate, e.current)}
              bullets={e.bullets}
              splittable
            />
          ))}
        </>
      );

    case "education":
      return (
        <>
          {content.education.map((e) => (
            <Entry
              key={e.id}
              title={e.degree}
              subtitle={[e.institution, e.location]}
              date={formatRange(e.startDate, e.endDate)}
              bullets={e.bullets}
            />
          ))}
        </>
      );

    case "skills":
      return (
        <>
          {content.skills
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div className="rt-skillgroup" key={g.id} data-block>
                {g.name && <div className="rt-skillname">{g.name}</div>}
                <ul className="rt-skills">
                  {g.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
        </>
      );

    case "projects":
      return (
        <>
          {content.projects.map((p) => (
            <Entry
              key={p.id}
              title={p.name}
              subtitle={[p.technologies.join(", "), p.link]}
              bullets={p.bullets}
            />
          ))}
        </>
      );

    case "certifications":
      return (
        <>
          {content.certifications.map((c) => (
            <Entry
              key={c.id}
              title={c.name}
              subtitle={[c.issuer]}
              date={formatMonth(c.date)}
            />
          ))}
        </>
      );

    case "languages":
      return (
        <ul className="rt-langs" data-block>
          {content.languages.map((l) => (
            <li key={l.id}>
              <span className="rt-lang-name">{l.name}</span>
              {l.level && <span className="rt-lang-level">{l.level}</span>}
            </li>
          ))}
        </ul>
      );

    case "awards":
      return (
        <>
          {content.awards.map((a) => (
            <Entry
              key={a.id}
              title={a.title}
              subtitle={[a.issuer]}
              date={formatMonth(a.date)}
              text={a.description}
            />
          ))}
        </>
      );

    case "volunteer":
      return (
        <>
          {content.volunteer.map((v) => (
            <Entry
              key={v.id}
              title={v.role}
              subtitle={[v.organization]}
              date={formatRange(v.startDate, v.endDate, v.current)}
              bullets={v.bullets}
            />
          ))}
        </>
      );

    default: {
      const section = content.custom.find((c) => c.id === id);
      if (!section) return null;
      return (
        <>
          {section.entries.map((e: CustomEntry) => (
            <Entry
              key={e.id}
              title={e.heading}
              subtitle={[e.subheading]}
              date={e.date}
              bullets={e.bullets}
            />
          ))}
        </>
      );
    }
  }
}

function sectionTitle(id: string, content: ResumeContent): string {
  if (isBuiltinSection(id)) return SECTION_TITLES[id];
  return content.custom.find((c) => c.id === id)?.title.trim() || "Additional";
}

function Section({
  id,
  content,
  config,
}: {
  id: string;
  content: ResumeContent;
  config: SectionConfig;
}) {
  return (
    <section
      className={`rt-sec rt-sec-${isBuiltinSection(id) ? id : "custom"}`}
      data-section={id}
      data-pagebreak={config.pageBreakBefore ? "" : undefined}
    >
      <h2 className="rt-sec-title">{sectionTitle(id, content)}</h2>
      <div className="rt-sec-body">
        <SectionBody id={id} content={content} />
      </div>
    </section>
  );
}

function ContactList({ content }: { content: ResumeContent }) {
  const items = contactItems(content.personal);
  if (items.length === 0) return null;
  return (
    <ul className="rt-contact">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Header({ content, contact = true }: { content: ResumeContent; contact?: boolean }) {
  const { personal } = content;
  return (
    <header className="rt-header" data-block>
      <div className="rt-id">
        <h1 className="rt-name">{displayName(personal)}</h1>
        {personal.jobTitle && <div className="rt-jobtitle">{personal.jobTitle}</div>}
      </div>
      {contact && <ContactList content={content} />}
    </header>
  );
}

/* ------------------------------------------------------------------- sheet */

const SIDEBAR_LAYOUTS = ["sidebar-left", "sidebar-right"];

/**
 * One résumé, one continuous sheet. Pagination (where the page breaks fall)
 * is applied afterwards by `paginate()`; this component only decides *what*
 * goes in which column, in the user's order.
 */
export default function ResumeSheet({ doc }: { doc: SheetDoc }) {
  const { content, design } = doc;
  const spec = effectiveSpec(doc.templateId, design.ats);

  const visible = doc.sections.filter(
    (s) => s.visible && sectionHasContent(content, s.id),
  );

  const twoColumn = spec.layout !== "single";
  const sideIds = new Set(spec.side ?? []);
  const main = twoColumn ? visible.filter((s) => !sideIds.has(s.id)) : visible;
  const side = twoColumn ? visible.filter((s) => sideIds.has(s.id)) : [];

  const isSidebar = SIDEBAR_LAYOUTS.includes(spec.layout);
  const banner = spec.header === "banner";
  // Sidebar layouts put the name in the main column and the contact details in
  // the rail — unless the header is a full-width banner, which keeps both.
  const headerInColumn = isSidebar && !banner;
  const contactInRail = headerInColumn && contactItems(content.personal).length > 0;

  const renderSections = (list: SectionConfig[]): ReactNode =>
    list.map((config) => (
      <Section key={config.id} id={config.id} content={content} config={config} />
    ));

  const className = [
    "rt",
    `rt-l-${spec.layout}`,
    `rt-hd-${spec.header}`,
    `rt-h-${spec.heading}`,
    `rt-e-${spec.entry}`,
    `rt-s-${spec.skills}`,
    `rt-b-${spec.bullet}`,
    design.ats ? "rt-ats" : "",
    headerInColumn ? "" : "rt-has-top",
  ]
    .filter(Boolean)
    .join(" ");

  const rail = (isSidebar || side.length > 0) && (
    <aside className="rt-side">
      {contactInRail && (
        <section className="rt-sec rt-sec-contact" data-section="contact">
          <h2 className="rt-sec-title">Contact</h2>
          <div className="rt-sec-body">
            <div data-block>
              <ContactList content={content} />
            </div>
          </div>
        </section>
      )}
      {renderSections(side)}
    </aside>
  );

  return (
    <div className={className} style={buildStyle(spec, design)} data-template={spec.id}>
      {!headerInColumn && <Header content={content} />}
      <div className="rt-body">
        {rail && spec.layout !== "split-right" && spec.layout !== "sidebar-right" && rail}
        <div className="rt-col">
          {headerInColumn && <Header content={content} contact={!contactInRail} />}
          <main className="rt-main">{renderSections(main)}</main>
        </div>
        {rail && (spec.layout === "split-right" || spec.layout === "sidebar-right") && rail}
      </div>
    </div>
  );
}
