import type { CustomEntry, ResumeContent, ResumeDoc } from "../types/resume";
import { normalizeContent } from "../types/resume";

/**
 * Everything the user types is rendered by React (which escapes text) and
 * never injected as HTML, so XSS is closed by construction. What this module
 * adds is *bounds*: control characters stripped, lengths and counts capped,
 * so a pasted megabyte or a hostile import cannot bloat a document past
 * Firestore's 1 MiB limit or wreck layout.
 */

const LIMITS = {
  field: 300,
  summary: 4000,
  bullet: 1000,
  description: 2000,
  entries: 40,
  bullets: 30,
  items: 80,
} as const;

// C0/C1 control characters except tab (\t) and newline (\n).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

export function cleanText(value: string, max: number): string {
  return value.replace(CONTROL_CHARS, "").slice(0, max);
}

const clean = (value: string) => cleanText(value, LIMITS.field);

const cleanBullets = (values: string[]) =>
  values
    .slice(0, LIMITS.bullets)
    .map((b) => cleanText(b, LIMITS.bullet))
    .filter((b) => b.trim().length > 0);

const cleanItems = (values: string[]) =>
  values
    .slice(0, LIMITS.items)
    .map((v) => clean(v).trim())
    .filter(Boolean);

/**
 * Only http(s), mailto and bare hosts are ever treated as links; anything
 * else (`javascript:`, `data:`…) is dropped rather than rendered.
 */
export function safeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "";
  return `https://${trimmed}`;
}

export function sanitizeContent(input: ResumeContent): ResumeContent {
  const c = normalizeContent(input);
  const cap = <T,>(items: T[]) => items.slice(0, LIMITS.entries);

  return {
    personal: {
      fullName: clean(c.personal.fullName),
      jobTitle: clean(c.personal.jobTitle),
      email: clean(c.personal.email),
      phone: clean(c.personal.phone),
      location: clean(c.personal.location),
      linkedin: clean(c.personal.linkedin),
      website: clean(c.personal.website),
      github: clean(c.personal.github),
    },
    summary: cleanText(c.summary, LIMITS.summary),
    experience: cap(c.experience).map((e) => ({
      ...e,
      position: clean(e.position),
      company: clean(e.company),
      location: clean(e.location),
      startDate: clean(e.startDate),
      endDate: clean(e.endDate),
      bullets: cleanBullets(e.bullets),
    })),
    education: cap(c.education).map((e) => ({
      ...e,
      degree: clean(e.degree),
      institution: clean(e.institution),
      location: clean(e.location),
      startDate: clean(e.startDate),
      endDate: clean(e.endDate),
      bullets: cleanBullets(e.bullets),
    })),
    skills: cap(c.skills).map((g) => ({
      ...g,
      name: clean(g.name),
      items: cleanItems(g.items),
    })),
    projects: cap(c.projects).map((p) => ({
      ...p,
      name: clean(p.name),
      link: clean(p.link),
      technologies: cleanItems(p.technologies),
      bullets: cleanBullets(p.bullets),
    })),
    certifications: cap(c.certifications).map((x) => ({
      ...x,
      name: clean(x.name),
      issuer: clean(x.issuer),
      date: clean(x.date),
      link: clean(x.link),
    })),
    languages: cap(c.languages).map((l) => ({
      ...l,
      name: clean(l.name),
      level: clean(l.level),
    })),
    awards: cap(c.awards).map((a) => ({
      ...a,
      title: clean(a.title),
      issuer: clean(a.issuer),
      date: clean(a.date),
      description: cleanText(a.description, LIMITS.description),
    })),
    volunteer: cap(c.volunteer).map((v) => ({
      ...v,
      role: clean(v.role),
      organization: clean(v.organization),
      startDate: clean(v.startDate),
      endDate: clean(v.endDate),
      bullets: cleanBullets(v.bullets),
    })),
    custom: cap(c.custom).map((section) => ({
      ...section,
      title: clean(section.title),
      entries: cap(section.entries).map(
        (e): CustomEntry => ({
          ...e,
          heading: clean(e.heading),
          subheading: clean(e.subheading),
          date: clean(e.date),
          bullets: cleanBullets(e.bullets),
        }),
      ),
    })),
  };
}

export function sanitizeDoc(doc: ResumeDoc): ResumeDoc {
  return {
    ...doc,
    title: clean(doc.title).trim() || "Untitled resume",
    content: sanitizeContent(doc.content),
  };
}
