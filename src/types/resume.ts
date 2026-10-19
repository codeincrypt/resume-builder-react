/**
 * The single canonical resume shape.
 *
 * Every layer speaks these types: the editor writes them, the upload parser
 * produces them, Firestore stores them verbatim and every template renders
 * them. Dates are `YYYY-MM` (or bare `YYYY`) strings — never Dayjs or
 * Timestamp — so a document round-trips through Firestore untouched.
 *
 * Content (what the resume says) is kept apart from design (how it looks) so
 * switching template can never lose a word.
 */

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  github: string;
}

export interface ExperienceItem {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface SkillGroup {
  id: string;
  /** e.g. "Technical", "Soft skills". Blank for an unlabelled list. */
  name: string;
  items: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  link: string;
  technologies: string[];
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface VolunteerItem {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface CustomEntry {
  id: string;
  heading: string;
  subheading: string;
  date: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomEntry[];
}

export interface ResumeContent {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  awards: AwardItem[];
  volunteer: VolunteerItem[];
  custom: CustomSection[];
}

/* ---------------------------------------------------------------- sections */

export const BUILTIN_SECTION_KEYS = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "awards",
  "volunteer",
] as const;

export type BuiltinSectionKey = (typeof BUILTIN_SECTION_KEYS)[number];

export const SECTION_TITLES: Record<BuiltinSectionKey, string> = {
  summary: "Professional summary",
  experience: "Work experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  languages: "Languages",
  awards: "Awards",
  volunteer: "Volunteer experience",
};

/**
 * Order and visibility of every section, built-in or custom. A section's `id`
 * is its `BuiltinSectionKey`, or the id of a `CustomSection`.
 */
export interface SectionConfig {
  id: string;
  visible: boolean;
  /** Start this section at the top of a new page. */
  pageBreakBefore: boolean;
}

export function isBuiltinSection(id: string): id is BuiltinSectionKey {
  return (BUILTIN_SECTION_KEYS as readonly string[]).includes(id);
}

/* ------------------------------------------------------------------ design */

export const PAGE_SIZES = {
  a4: { label: "A4", width: 794, height: 1123 },
  letter: { label: "US Letter", width: 816, height: 1056 },
} as const;

export type PageSize = keyof typeof PAGE_SIZES;

export type Spacing = "compact" | "normal" | "relaxed";
export type Margin = "narrow" | "normal" | "wide";

/**
 * Per-resume look. `null` means "use the template's own choice", so picking a
 * different template re-themes the resume instead of pinning the old look.
 */
export interface DesignSettings {
  accent: string | null;
  fontKey: string | null;
  /** Base font size in px. */
  fontSize: number | null;
  spacing: Spacing;
  margin: Margin;
  pageSize: PageSize;
  /** Plain single-column rendering with no decoration, for ATS parsers. */
  ats: boolean;
}

export const DEFAULT_DESIGN: DesignSettings = {
  accent: null,
  fontKey: null,
  fontSize: null,
  spacing: "normal",
  margin: "normal",
  pageSize: "a4",
  ats: false,
};

/* --------------------------------------------------------------- documents */

export interface OriginalFile {
  name: string;
  size: number;
  type: string;
  /** Cloud Storage object path, `users/{uid}/uploads/...`. */
  path: string;
}

export type ResumeSource = "scratch" | "upload";

export interface ResumeDoc {
  id: string;
  title: string;
  templateId: string;
  content: ResumeContent;
  design: DesignSettings;
  sections: SectionConfig[];
  source: ResumeSource;
  originalFile: OriginalFile | null;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

/* ---------------------------------------------------------------- defaults */

export function newId(): string {
  return crypto.randomUUID();
}

export const EMPTY_PERSONAL: PersonalInfo = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  github: "",
};

export function emptyContent(): ResumeContent {
  return {
    personal: { ...EMPTY_PERSONAL },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    awards: [],
    volunteer: [],
    custom: [],
  };
}

export function defaultSections(): SectionConfig[] {
  return BUILTIN_SECTION_KEYS.map((id) => ({
    id,
    visible: true,
    pageBreakBefore: false,
  }));
}

export function blankEntry<K extends keyof ResumeContent>(
  section: K,
): ResumeContent[K] extends Array<infer T> ? T : never {
  const id = newId();
  const entries = {
    experience: {
      id,
      position: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [],
    },
    education: {
      id,
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      bullets: [],
    },
    skills: { id, name: "", items: [] },
    projects: { id, name: "", link: "", technologies: [], bullets: [] },
    certifications: { id, name: "", issuer: "", date: "", link: "" },
    languages: { id, name: "", level: "" },
    awards: { id, title: "", issuer: "", date: "", description: "" },
    volunteer: {
      id,
      role: "",
      organization: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [],
    },
    custom: { id, title: "", entries: [] },
  } as const;
  return entries[section as keyof typeof entries] as never;
}

export function blankCustomEntry(): CustomEntry {
  return { id: newId(), heading: "", subheading: "", date: "", bullets: [] };
}

/* ------------------------------------------------------------- formatting */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** `2021-03` -> `Mar 2021`; a bare year is returned as-is; "" stays "". */
export function formatMonth(value: string): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  const monthIndex = Number(month) - 1;
  return MONTHS[monthIndex] ? `${MONTHS[monthIndex]} ${year}` : year;
}

/** `Mar 2021 – Present` for a date range on an entry. */
export function formatRange(
  startDate: string,
  endDate: string,
  current = false,
): string {
  const start = formatMonth(startDate);
  const end = current ? "Present" : formatMonth(endDate);
  if (!start && !end) return "";
  if (!end) return start;
  if (!start) return end;
  return `${start} – ${end}`;
}

/** Full name, or a placeholder when still blank. */
export function displayName(info: PersonalInfo, fallback = "Your Name"): string {
  return info.fullName.trim() || fallback;
}

export function contactItems(info: PersonalInfo): string[] {
  return [
    info.email,
    info.phone,
    info.location,
    info.linkedin,
    info.website,
    info.github,
  ].filter((value) => value.trim().length > 0);
}

/* ------------------------------------------------------------ normalising */

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function list<T>(value: unknown, map: (raw: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map(map);
}

function idOf(raw: Record<string, unknown>): string {
  return str(raw.id) || newId();
}

/**
 * Coerce anything read back from Firestore into a complete `ResumeContent`.
 * Templates index arrays directly, so every field is defaulted here rather
 * than guarded at each render site.
 */
export function normalizeContent(input: unknown): ResumeContent {
  const raw = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const p = (raw.personal && typeof raw.personal === "object"
    ? raw.personal
    : {}) as Record<string, unknown>;

  return {
    personal: {
      fullName: str(p.fullName),
      jobTitle: str(p.jobTitle),
      email: str(p.email),
      phone: str(p.phone),
      location: str(p.location),
      linkedin: str(p.linkedin),
      website: str(p.website),
      github: str(p.github),
    },
    summary: str(raw.summary),
    experience: list(raw.experience, (r) => ({
      id: idOf(r),
      position: str(r.position),
      company: str(r.company),
      location: str(r.location),
      startDate: str(r.startDate),
      endDate: str(r.endDate),
      current: r.current === true,
      bullets: strings(r.bullets),
    })),
    education: list(raw.education, (r) => ({
      id: idOf(r),
      degree: str(r.degree),
      institution: str(r.institution),
      location: str(r.location),
      startDate: str(r.startDate),
      endDate: str(r.endDate),
      bullets: strings(r.bullets),
    })),
    skills: list(raw.skills, (r) => ({
      id: idOf(r),
      name: str(r.name),
      items: strings(r.items),
    })),
    projects: list(raw.projects, (r) => ({
      id: idOf(r),
      name: str(r.name),
      link: str(r.link),
      technologies: strings(r.technologies),
      bullets: strings(r.bullets),
    })),
    certifications: list(raw.certifications, (r) => ({
      id: idOf(r),
      name: str(r.name),
      issuer: str(r.issuer),
      date: str(r.date),
      link: str(r.link),
    })),
    languages: list(raw.languages, (r) => ({
      id: idOf(r),
      name: str(r.name),
      level: str(r.level),
    })),
    awards: list(raw.awards, (r) => ({
      id: idOf(r),
      title: str(r.title),
      issuer: str(r.issuer),
      date: str(r.date),
      description: str(r.description),
    })),
    volunteer: list(raw.volunteer, (r) => ({
      id: idOf(r),
      role: str(r.role),
      organization: str(r.organization),
      startDate: str(r.startDate),
      endDate: str(r.endDate),
      current: r.current === true,
      bullets: strings(r.bullets),
    })),
    custom: list(raw.custom, (r) => ({
      id: idOf(r),
      title: str(r.title),
      entries: list(r.entries, (e) => ({
        id: idOf(e),
        heading: str(e.heading),
        subheading: str(e.subheading),
        date: str(e.date),
        bullets: strings(e.bullets),
      })),
    })),
  };
}

export function normalizeDesign(input: unknown): DesignSettings {
  const raw = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const pick = <T extends string>(value: unknown, allowed: readonly T[], fb: T): T =>
    allowed.includes(value as T) ? (value as T) : fb;

  return {
    accent:
      typeof raw.accent === "string" && /^#[0-9a-f]{6}$/i.test(raw.accent)
        ? raw.accent
        : null,
    fontKey: typeof raw.fontKey === "string" ? raw.fontKey : null,
    fontSize:
      typeof raw.fontSize === "number" && raw.fontSize >= 9 && raw.fontSize <= 16
        ? raw.fontSize
        : null,
    spacing: pick(raw.spacing, ["compact", "normal", "relaxed"], "normal"),
    margin: pick(raw.margin, ["narrow", "normal", "wide"], "normal"),
    pageSize: pick(raw.pageSize, ["a4", "letter"], "a4"),
    ats: raw.ats === true,
  };
}

/**
 * Reconcile the stored section list with the content: every built-in section
 * and every custom section appears exactly once, in stored order, and anything
 * missing is appended. Keeps old documents valid as sections are added.
 */
export function normalizeSections(
  input: unknown,
  custom: CustomSection[],
): SectionConfig[] {
  const stored = list(input, (r) => ({
    id: str(r.id),
    visible: r.visible !== false,
    pageBreakBefore: r.pageBreakBefore === true,
  }));
  const valid = new Set<string>([
    ...BUILTIN_SECTION_KEYS,
    ...custom.map((c) => c.id),
  ]);

  const seen = new Set<string>();
  const result: SectionConfig[] = [];
  for (const section of stored) {
    if (valid.has(section.id) && !seen.has(section.id)) {
      seen.add(section.id);
      result.push(section);
    }
  }
  for (const id of valid) {
    if (!seen.has(id)) {
      result.push({ id, visible: true, pageBreakBefore: false });
    }
  }
  return result;
}

/** True when there is nothing worth rendering yet. */
export function isContentEmpty(content: ResumeContent): boolean {
  return (
    !content.personal.fullName &&
    !content.personal.email &&
    !content.summary &&
    content.experience.length === 0 &&
    content.education.length === 0 &&
    content.skills.length === 0 &&
    content.projects.length === 0 &&
    content.certifications.length === 0 &&
    content.languages.length === 0 &&
    content.awards.length === 0 &&
    content.volunteer.length === 0 &&
    content.custom.length === 0
  );
}

/** Whether a section has anything to show (hidden sections never render). */
export function sectionHasContent(content: ResumeContent, id: string): boolean {
  switch (id) {
    case "summary":
      return content.summary.trim().length > 0;
    case "experience":
      return content.experience.length > 0;
    case "education":
      return content.education.length > 0;
    case "skills":
      return content.skills.some((group) => group.items.length > 0);
    case "projects":
      return content.projects.length > 0;
    case "certifications":
      return content.certifications.length > 0;
    case "languages":
      return content.languages.length > 0;
    case "awards":
      return content.awards.length > 0;
    case "volunteer":
      return content.volunteer.length > 0;
    default: {
      const custom = content.custom.find((c) => c.id === id);
      return !!custom && custom.entries.length > 0;
    }
  }
}
