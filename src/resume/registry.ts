/**
 * The template catalogue — pure data, no components.
 *
 * Every template is rendered by the one renderer in `ResumeSheet.tsx`; what
 * makes a template *itself* is the combination of structural choices below
 * (layout, header, heading, entry and skill styles), typography and palette.
 * Adding a template means adding one entry here — the gallery, filters,
 * landing page, editor switcher and PDF export all read this list.
 */

export type TemplateCategory =
  | "professional"
  | "modern"
  | "minimal"
  | "creative"
  | "executive"
  | "academic"
  | "ats";

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  professional: "Professional",
  modern: "Modern",
  minimal: "Minimal",
  creative: "Creative",
  executive: "Executive",
  academic: "Academic",
  ats: "ATS-Friendly",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as TemplateCategory[];

/** Where the columns sit. `sidebar-*` have a coloured rail; `split-*` don't. */
export type LayoutKind =
  | "single"
  | "split-right"
  | "split-left"
  | "sidebar-left"
  | "sidebar-right";

export type HeaderKind = "center" | "left" | "split" | "banner" | "bar";

export type HeadingKind =
  | "underline"
  | "caps-rule"
  | "side"
  | "bar"
  | "plain"
  | "block"
  | "box"
  | "double"
  | "serif";

/** How an entry arranges title, company and dates. */
export type EntryKind = "inline" | "stacked" | "rail" | "timeline";

export type SkillKind = "inline" | "chips" | "outline" | "columns" | "dots" | "stack";

export type BulletKind = "disc" | "dash" | "square" | "arrow";

export interface TemplateSpec {
  id: string;
  name: string;
  tagline: string;
  categories: TemplateCategory[];
  /** Plain, single-column and safe for applicant-tracking parsers. */
  atsFriendly: boolean;

  layout: LayoutKind;
  header: HeaderKind;
  heading: HeadingKind;
  entry: EntryKind;
  skills: SkillKind;
  bullet: BulletKind;

  fontHead: string;
  fontBody: string;

  /** Headings, rules, chips. */
  accent: string;
  /** Header band / side-rail fill. "accent" follows the accent colour;
   *  unset derives a dark shade of it. */
  ink?: string;
  text?: string;

  /** Base font size, px. */
  fontSize: number;
  /** Vertical rhythm multiplier (1 = normal). */
  density: number;

  nameStyle?: {
    size?: number;
    weight?: number;
    caps?: boolean;
    spacing?: number;
  };
  /** Section titles in capitals (default true). */
  headCaps?: boolean;
  round?: boolean;
  /** Sections that live in the side column on two-column layouts. */
  side?: string[];
}

const SIDE_DEFAULT = ["skills", "languages", "certifications"];

const SPECS: TemplateSpec[] = [
  {
    id: "tokyo",
    name: "Tokyo",
    tagline: "Minimalist and modern, with dates on a quiet left rail.",
    categories: ["minimal", "modern"],
    atsFriendly: false,
    layout: "single",
    header: "left",
    heading: "plain",
    entry: "rail",
    skills: "dots",
    bullet: "dash",
    fontHead: "inter",
    fontBody: "inter",
    accent: "#c1272d",
    fontSize: 12.5,
    density: 1.05,
    nameStyle: { size: 2.3, weight: 300, spacing: -0.01 },
    headCaps: true,
  },
  {
    id: "paris",
    name: "Paris",
    tagline: "Elegant and editorial, set in classic serif type.",
    categories: ["creative", "executive"],
    atsFriendly: false,
    layout: "single",
    header: "center",
    heading: "serif",
    entry: "inline",
    skills: "dots",
    bullet: "disc",
    fontHead: "playfair",
    fontBody: "garamond",
    accent: "#7a2e3a",
    fontSize: 14,
    density: 1.05,
    nameStyle: { size: 2.7, weight: 500 },
    headCaps: false,
  },
  {
    id: "london",
    name: "London",
    tagline: "Traditional corporate, ruled sections and a steady serif.",
    categories: ["professional", "executive", "academic", "ats"],
    atsFriendly: true,
    layout: "single",
    header: "center",
    heading: "double",
    entry: "inline",
    skills: "inline",
    bullet: "disc",
    fontHead: "merriweather",
    fontBody: "merriweather",
    accent: "#1b2a4e",
    fontSize: 12,
    density: 1,
    nameStyle: { size: 2.1, weight: 700, caps: true, spacing: 0.04 },
  },
  {
    id: "new-delhi",
    name: "New Delhi",
    tagline: "Contemporary professional with a deep indigo side rail.",
    categories: ["modern", "professional"],
    atsFriendly: false,
    layout: "sidebar-left",
    header: "left",
    heading: "box",
    entry: "inline",
    skills: "stack",
    bullet: "disc",
    fontHead: "work-sans",
    fontBody: "work-sans",
    accent: "#e07a1f",
    ink: "#26335f",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.5, weight: 700 },
  },
  {
    id: "singapore",
    name: "Singapore",
    tagline: "Compact, single column and built for ATS parsers.",
    categories: ["ats", "professional", "minimal"],
    atsFriendly: true,
    layout: "single",
    header: "left",
    heading: "underline",
    entry: "inline",
    skills: "inline",
    bullet: "disc",
    fontHead: "source-sans",
    fontBody: "source-sans",
    accent: "#1f2937",
    fontSize: 12,
    density: 0.82,
    nameStyle: { size: 2.1, weight: 700 },
  },
  {
    id: "seoul",
    name: "Seoul",
    tagline: "Modern, technology-focused with a timeline and skill chips.",
    categories: ["modern", "creative"],
    atsFriendly: false,
    layout: "split-right",
    header: "bar",
    heading: "block",
    entry: "timeline",
    skills: "chips",
    bullet: "arrow",
    fontHead: "space-grotesk",
    fontBody: "plex-sans",
    accent: "#3b5bdb",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.4, weight: 700 },
    round: true,
  },
  {
    id: "berlin",
    name: "Berlin",
    tagline: "Bold and minimalist: heavy type, black and a single yellow.",
    categories: ["modern", "minimal"],
    atsFriendly: false,
    layout: "single",
    header: "left",
    heading: "box",
    entry: "stacked",
    skills: "outline",
    bullet: "square",
    fontHead: "montserrat",
    fontBody: "montserrat",
    accent: "#e0a800",
    ink: "#111111",
    text: "#171717",
    fontSize: 12,
    density: 1,
    nameStyle: { size: 2.8, weight: 800, caps: true, spacing: -0.01 },
  },
  {
    id: "canberra",
    name: "Canberra",
    tagline: "Government and public sector: clear, structured and factual.",
    categories: ["professional", "ats"],
    atsFriendly: true,
    layout: "single",
    header: "split",
    heading: "underline",
    entry: "inline",
    skills: "columns",
    bullet: "disc",
    fontHead: "source-sans",
    fontBody: "source-sans",
    accent: "#0b5d3b",
    fontSize: 13,
    density: 1,
    nameStyle: { size: 2.2, weight: 700 },
  },
  {
    id: "ottawa",
    name: "Ottawa",
    tagline: "Formal corporate with restrained red accents.",
    categories: ["professional", "executive", "ats"],
    atsFriendly: true,
    layout: "single",
    header: "center",
    heading: "caps-rule",
    entry: "inline",
    skills: "inline",
    bullet: "disc",
    fontHead: "crimson",
    fontBody: "crimson",
    accent: "#a4161a",
    fontSize: 14,
    density: 1,
    nameStyle: { size: 2.5, weight: 600, caps: true, spacing: 0.06 },
  },
  {
    id: "madrid",
    name: "Madrid",
    tagline: "Stylish and balanced, with a warm serif title and side column.",
    categories: ["modern", "creative"],
    atsFriendly: false,
    layout: "split-right",
    header: "split",
    heading: "serif",
    entry: "inline",
    skills: "chips",
    bullet: "disc",
    fontHead: "playfair",
    fontBody: "dm-sans",
    accent: "#c2410c",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.5, weight: 600 },
    round: true,
  },
  {
    id: "rome",
    name: "Rome",
    tagline: "Classic and refined, ruled headings in warm bronze.",
    categories: ["professional", "executive", "academic", "ats"],
    atsFriendly: true,
    layout: "single",
    header: "center",
    heading: "double",
    entry: "inline",
    skills: "dots",
    bullet: "disc",
    fontHead: "garamond",
    fontBody: "garamond",
    accent: "#7c5e2a",
    fontSize: 14.5,
    density: 1,
    nameStyle: { size: 2.6, weight: 500, caps: true, spacing: 0.08 },
  },
  {
    id: "bangkok",
    name: "Bangkok",
    tagline: "Vibrant but professional: teal rail, golden highlights.",
    categories: ["creative", "modern"],
    atsFriendly: false,
    layout: "sidebar-right",
    header: "left",
    heading: "bar",
    entry: "timeline",
    skills: "chips",
    bullet: "disc",
    fontHead: "dm-sans",
    fontBody: "dm-sans",
    accent: "#e59a0c",
    ink: "#0e6f7a",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.5, weight: 800 },
    round: true,
  },
  {
    id: "cairo",
    name: "Cairo",
    tagline: "Strong typography with section labels set in the margin.",
    categories: ["professional", "modern"],
    atsFriendly: false,
    layout: "single",
    header: "bar",
    heading: "side",
    entry: "stacked",
    skills: "columns",
    bullet: "square",
    fontHead: "montserrat",
    fontBody: "source-sans",
    accent: "#b45309",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.7, weight: 800, caps: true },
  },
  {
    id: "brasilia",
    name: "Brasília",
    tagline: "Contemporary and balanced, with a narrow skills column.",
    categories: ["modern", "professional"],
    atsFriendly: false,
    layout: "split-left",
    header: "left",
    heading: "block",
    entry: "rail",
    skills: "stack",
    bullet: "dash",
    fontHead: "inter",
    fontBody: "inter",
    accent: "#0b6e4f",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.4, weight: 700 },
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    tagline: "Clean and colourful, filled section bars and tinted chips.",
    categories: ["modern", "creative"],
    atsFriendly: false,
    layout: "single",
    header: "left",
    heading: "bar",
    entry: "inline",
    skills: "chips",
    bullet: "disc",
    fontHead: "dm-sans",
    fontBody: "dm-sans",
    accent: "#ea580c",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.6, weight: 800 },
    round: true,
  },
  {
    id: "vienna",
    name: "Vienna",
    tagline: "Elegant and premium: a cream side rail and brass accents.",
    categories: ["executive", "academic", "professional"],
    atsFriendly: false,
    layout: "sidebar-left",
    header: "left",
    heading: "serif",
    entry: "inline",
    skills: "stack",
    bullet: "disc",
    fontHead: "playfair",
    fontBody: "lora",
    accent: "#8a6a34",
    ink: "#f3ede2",
    text: "#2b2418",
    fontSize: 12.5,
    density: 1.05,
    nameStyle: { size: 2.5, weight: 600 },
    headCaps: false,
  },
  {
    id: "stockholm",
    name: "Stockholm",
    tagline: "Scandinavian minimalism: air, light type, labels in the margin.",
    categories: ["minimal"],
    atsFriendly: false,
    layout: "single",
    header: "left",
    heading: "side",
    entry: "stacked",
    skills: "dots",
    bullet: "dash",
    fontHead: "inter",
    fontBody: "inter",
    accent: "#4a6fa5",
    fontSize: 12.5,
    density: 1.2,
    nameStyle: { size: 2.4, weight: 300 },
  },
  {
    id: "oslo",
    name: "Oslo",
    tagline: "Simple and highly readable, with one thin rule per section.",
    categories: ["minimal", "professional", "ats"],
    atsFriendly: true,
    layout: "single",
    header: "left",
    heading: "underline",
    entry: "stacked",
    skills: "inline",
    bullet: "disc",
    fontHead: "source-sans",
    fontBody: "source-sans",
    accent: "#0369a1",
    fontSize: 13.5,
    density: 1,
    nameStyle: { size: 2.3, weight: 600 },
  },
  {
    id: "helsinki",
    name: "Helsinki",
    tagline: "Technical and organised, monospaced details and a side column.",
    categories: ["modern", "professional"],
    atsFriendly: false,
    layout: "split-right",
    header: "split",
    heading: "box",
    entry: "inline",
    skills: "columns",
    bullet: "arrow",
    fontHead: "jetbrains",
    fontBody: "plex-sans",
    accent: "#1d4ed8",
    fontSize: 12,
    density: 0.95,
    nameStyle: { size: 2.2, weight: 700 },
  },
  {
    id: "copenhagen",
    name: "Copenhagen",
    tagline: "Modern Nordic: a pale blue-grey rail and calm, even type.",
    categories: ["modern", "minimal"],
    atsFriendly: false,
    layout: "sidebar-left",
    header: "left",
    heading: "plain",
    entry: "stacked",
    skills: "stack",
    bullet: "dash",
    fontHead: "dm-sans",
    fontBody: "dm-sans",
    accent: "#2f6f8f",
    ink: "#e6edf2",
    text: "#1f2d38",
    fontSize: 12.5,
    density: 1.05,
    nameStyle: { size: 2.4, weight: 600 },
  },
  {
    id: "lisbon",
    name: "Lisbon",
    tagline: "Creative and approachable: terracotta banner and a timeline.",
    categories: ["creative"],
    atsFriendly: false,
    layout: "single",
    header: "banner",
    heading: "block",
    entry: "timeline",
    skills: "chips",
    bullet: "arrow",
    fontHead: "work-sans",
    fontBody: "lora",
    accent: "#d9552f",
    ink: "accent",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.6, weight: 700 },
    round: true,
  },
  {
    id: "athens",
    name: "Athens",
    tagline: "Academic and research-oriented, ordered and serif.",
    categories: ["academic", "professional", "ats"],
    atsFriendly: true,
    layout: "single",
    header: "center",
    heading: "underline",
    entry: "inline",
    skills: "inline",
    bullet: "disc",
    fontHead: "baskerville",
    fontBody: "baskerville",
    accent: "#1e3a8a",
    fontSize: 12,
    density: 1,
    nameStyle: { size: 2.1, weight: 700 },
    headCaps: true,
  },
  {
    id: "jakarta",
    name: "Jakarta",
    tagline: "Compact and flexible: slim side column, filled section bars.",
    categories: ["modern", "professional"],
    atsFriendly: false,
    layout: "split-right",
    header: "left",
    heading: "bar",
    entry: "inline",
    skills: "outline",
    bullet: "disc",
    fontHead: "inter",
    fontBody: "inter",
    accent: "#dc2626",
    ink: "#7f1d1d",
    fontSize: 12,
    density: 0.85,
    nameStyle: { size: 2.3, weight: 800 },
  },
  {
    id: "wellington",
    name: "Wellington",
    tagline: "Friendly and contemporary, rounded chips and soft teal.",
    categories: ["modern", "creative"],
    atsFriendly: false,
    layout: "single",
    header: "split",
    heading: "block",
    entry: "stacked",
    skills: "chips",
    bullet: "disc",
    fontHead: "dm-sans",
    fontBody: "dm-sans",
    accent: "#0d9488",
    fontSize: 12.5,
    density: 1.05,
    nameStyle: { size: 2.5, weight: 700 },
    round: true,
  },
  {
    id: "abu-dhabi",
    name: "Abu Dhabi",
    tagline: "Executive and leadership-focused: navy banner, gold rules.",
    categories: ["executive", "professional"],
    atsFriendly: false,
    layout: "split-right",
    header: "banner",
    heading: "underline",
    entry: "inline",
    skills: "stack",
    bullet: "square",
    fontHead: "playfair",
    fontBody: "source-sans",
    accent: "#b8892b",
    ink: "#14213d",
    fontSize: 12.5,
    density: 1,
    nameStyle: { size: 2.7, weight: 600, spacing: 0.01 },
  },
];

export const TEMPLATES: TemplateSpec[] = SPECS.map((spec) => ({
  ...spec,
  side: spec.side ?? SIDE_DEFAULT,
}));

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export const DEFAULT_TEMPLATE_ID = "london";

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function isTemplateId(value: unknown): value is string {
  return typeof value === "string" && BY_ID.has(value);
}

export function getTemplate(id: string | null | undefined): TemplateSpec {
  return (id && BY_ID.get(id)) || (BY_ID.get(DEFAULT_TEMPLATE_ID) as TemplateSpec);
}
