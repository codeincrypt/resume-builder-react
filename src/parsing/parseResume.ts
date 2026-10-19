import type {
  AwardItem,
  CertificationItem,
  CustomEntry,
  CustomSection,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  ResumeContent,
  SkillGroup,
  VolunteerItem,
} from "../types/resume";
import { emptyContent, newId } from "../types/resume";
import {
  ANY_URL_RE,
  BULLET_RE,
  COMPANY_RE,
  COUNTRIES,
  DATE_RE,
  DEGREE_RE,
  EMAIL_RE,
  GITHUB_RE,
  HEADINGS,
  HUMAN_LANGUAGES,
  INSTITUTION_RE,
  LEVEL_RE,
  LINKEDIN_RE,
  PHONE_RE,
  PRESENT_RE,
  RANGE_RE,
  SOFT_SKILL_HINT_RE,
  TITLE_RE,
  URL_RE,
  toYearMonth,
} from "./patterns";
import type { HeadingRule, SectionKind } from "./patterns";

/**
 * Rule-based résumé parser. Plain text in, `ResumeContent` plus a list of
 * things the user should double-check out. No model, no network.
 *
 * Principles:
 *  - Wording is preserved. Bullet glyphs and wrap-induced line breaks are
 *    removed; nothing is rephrased, summarised or invented.
 *  - Anything the rules cannot place stays in the document (in the nearest
 *    section, or a custom section) rather than being dropped.
 *  - When a guess was needed, or a field is simply absent, the parser says so
 *    through `issues`, so the review screen can highlight it.
 */

export type IssueLevel = "missing" | "uncertain";

export interface ParseIssue {
  /** e.g. `personal.fullName`, `experience.<entryId>.company`, `section.education`. */
  path: string;
  level: IssueLevel;
  message: string;
}

export interface ParseResult {
  content: ResumeContent;
  issues: ParseIssue[];
  /** Sections that had content, for the "what we found" summary. */
  found: SectionKind[];
}

/* ----------------------------------------------------------------- helpers */

const isBullet = (line: string) => BULLET_RE.test(line);
const stripBullet = (line: string) => line.replace(BULLET_RE, "").trim();
const isBlank = (line: string) => line.trim() === "";
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

function normalise(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\f/g, "\n\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    // Rules and dividers that came through as text ("———", "-_—", "* * *").
    .map((line) => (/^[^\p{L}\p{N}]*$/u.test(line) ? "" : line));
}

/** Text between separators, ignoring separators inside ( ) or [ ]. */
function splitOutsideBrackets(text: string, separators: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if ("([{".includes(ch)) depth += 1;
    else if (")]}".includes(ch)) depth = Math.max(0, depth - 1);
    if (depth === 0 && separators.test(ch)) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const LIST_SEPARATORS = /[,;|•·●▪‣∙]/;

function findRange(line: string) {
  const match = RANGE_RE.exec(line);
  if (!match) return null;
  const startDate = toYearMonth(match[1]);
  const endRaw = match[2];
  const current = PRESENT_RE.test(endRaw.trim());
  return {
    start: startDate,
    end: current ? "" : toYearMonth(endRaw),
    current,
    index: match.index,
    length: match[0].length,
  };
}

/** The line with a date span removed, plus the debris around it. */
function removeSpan(line: string, index: number, length: number): string {
  return (line.slice(0, index) + " " + line.slice(index + length))
    .replace(/[([]\s*[)\]]/g, "")
    .replace(/\s+[|•·–—-]\s*$/g, "")
    .replace(/^\s*[|•·–—-]\s+/g, "")
    .replace(/\s+[|•·]\s+[|•·]\s+/g, " | ")
    .replace(/\s{2,}/g, " ")
    .replace(/[,;:]\s*$/, "")
    .trim();
}

function sentenceEnd(line: string): boolean {
  if (!/[.!?]$/.test(line.trim())) return false;
  // "Acme Inc." / "Sr." are abbreviations, not the end of a sentence.
  const last = words(line).pop() ?? "";
  return !/^(?:[A-Z][a-z]{0,3}|[A-Z]{1,4})\.$/.test(last);
}

/** Short, title-case-ish, not a sentence: could be a role/company line. */
function isHeaderCandidate(line: string): boolean {
  const t = line.trim();
  return (
    t.length > 0 &&
    t.length <= 90 &&
    !isBullet(t) &&
    !sentenceEnd(t) &&
    !/^[a-z]/.test(t)
  );
}

function looksLikeLocation(text: string): boolean {
  const t = text.trim().replace(/\.$/, "");
  if (!t || /\d{3,}\b.*\d{3,}/.test(t)) return false;
  if (/@|https?:|www\./i.test(t)) return false;
  if (TITLE_RE.test(t) || COMPANY_RE.test(t) || DEGREE_RE.test(t)) return false;
  const lower = t.toLowerCase();
  if (COUNTRIES.has(lower)) return true;
  if (/^(?:remote|hybrid|on-?site)$/i.test(t)) return true;
  // "City, ST", "City, ST 12345", "City, Country", "City, Region, Country"
  return /^[\p{L}][\p{L}.'’ -]*(?:,\s*[\p{L}][\p{L}.'’ -]*){1,2}(?:\s+\d{4,6})?$/u.test(t) &&
    words(t).length <= 6;
}

/** Peel a trailing ", ST" / ", Country" off a company name. */
function splitTrailingLocation(text: string): { rest: string; location: string } {
  const parts = text.split(/,\s*/);
  if (parts.length < 2) return { rest: text, location: "" };
  const last = parts[parts.length - 1].trim();
  const isState = /^[A-Z]{2}$/.test(last);
  const isCountry = COUNTRIES.has(last.toLowerCase());
  if (!isState && !isCountry) return { rest: text, location: "" };
  if (COMPANY_RE.test(last)) return { rest: text, location: "" };

  const take = parts.length >= 3 && isState ? 2 : 1;
  const location = parts.slice(-take).join(", ");
  const rest = parts.slice(0, -take).join(", ");
  return rest ? { rest, location } : { rest: text, location: "" };
}

/* --------------------------------------------------------------- sectioning */

interface Section {
  kind: SectionKind;
  title: string;
  group?: string;
  lines: string[];
}

function headingKey(line: string): string {
  return line
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Heading vocabulary with spaces removed, for letter-spaced headings. */
const HEADINGS_COMPACT = new Map(
  [...HEADINGS].map(([key, rule]) => [key.replace(/ /g, ""), { rule, key }]),
);

/** "W O R K  E X P E R I E N C E" — designer templates letter-space headings
 *  and text extraction then sees a space between every glyph. */
function isLetterSpaced(line: string): boolean {
  return /^(?:\S\s+){3,}\S$/.test(line) && line.split(/\s+/).every((t) => t.length === 1);
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/**
 * OCR misreads letters ("GERTIFICATIONS"). A line *styled* like a heading —
 * capitals, short, no digits — may match the vocabulary within one edit (two
 * for long headings). Ordinary text never gets this leeway.
 */
function fuzzyHeading(line: string): HeadingRule | null {
  const t = line.trim().replace(/[:：]\s*$/, "");
  if (t.length < 6 || t.length > 32 || /\d/.test(t) || t !== t.toUpperCase()) return null;
  const key = headingKey(t);
  const max = key.length >= 12 ? 2 : 1;
  for (const [candidate, rule] of HEADINGS) {
    if (candidate.length >= 6 && editDistance(key, candidate, max) <= max) return rule;
  }
  return null;
}

function matchHeading(line: string) {
  const trimmed = line.trim();
  if (!trimmed || isBullet(trimmed)) return null;
  if (isLetterSpaced(trimmed)) {
    const compact = headingKey(trimmed.replace(/[:：]\s*$/, "")).replace(/ /g, "");
    return HEADINGS_COMPACT.get(compact)?.rule ?? null;
  }
  if (trimmed.length > 48) return null;
  const rule =
    HEADINGS.get(headingKey(trimmed.replace(/[:：]\s*$/, ""))) ?? fuzzyHeading(trimmed);
  if (!rule) return null;
  // A heading is a heading on its own line; with a trailing sentence it is not.
  if (/[.!?]$/.test(trimmed)) return null;
  return rule;
}

/** The heading as it should be shown, with letter-spacing undone. */
function headingTitle(line: string): string {
  const trimmed = line.trim().replace(/[:：]\s*$/, "");
  if (!isLetterSpaced(trimmed)) {
    if (HEADINGS.has(headingKey(trimmed))) return trimmed;
    // A fuzzy (OCR-misread) match is titled with the word it matched.
    const key = headingKey(trimmed);
    for (const [candidate] of HEADINGS) {
      const max = key.length >= 12 ? 2 : 1;
      if (candidate.length >= 6 && editDistance(key, candidate, max) <= max) {
        return candidate.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
      }
    }
    return trimmed;
  }
  const compact = headingKey(trimmed).replace(/ /g, "");
  const key = HEADINGS_COMPACT.get(compact)?.key ?? compact;
  return key.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
}

const INLINE_HEADING_KINDS: SectionKind[] = ["skills", "languages", "certifications", "summary"];

/** Labels that more often introduce a project's tools than a skills section. */
const AMBIGUOUS_INLINE = new Set(["technologies", "tech stack", "tools and technologies"]);

/** "Skills: Python, Java" — a heading with its content on the same line. */
function matchInlineHeading(line: string) {
  const m = /^([A-Za-z &]{3,34}?)\s*[:：]\s*(\S.*)$/.exec(line.trim());
  if (!m) return null;
  const key = headingKey(m[1]);
  const rule = HEADINGS.get(key);
  if (!rule || !INLINE_HEADING_KINDS.includes(rule.kind) || AMBIGUOUS_INLINE.has(key)) return null;
  return { rule, title: m[1].trim(), rest: m[2].trim() };
}

type HeadingStyle = "caps" | "spaced" | "mixed";

function headingStyle(line: string): HeadingStyle {
  const t = line.trim();
  if (isLetterSpaced(t)) return "spaced";
  return t === t.toUpperCase() && /\p{Lu}/u.test(t) ? "caps" : "mixed";
}

/** Headings that are also ordinary list words ("Leadership" as a skill). */
const WEAK_HEADINGS = new Set([
  "leadership", "languages", "expertise", "training", "technologies", "courses",
  "research", "activities", "other", "additional", "about", "overview", "interests",
  "hobbies", "speaking", "talks", "competencies", "recognition", "achievements",
  "accomplishments", "certification", "qualifications", "profile", "references",
  "soft skills", "interpersonal skills", "personal skills",
]);

function nextContent(lines: string[], from: number): string {
  for (let i = from; i < lines.length; i += 1) {
    if (!isBlank(lines[i])) return lines[i].trim();
  }
  return "";
}

function splitSections(lines: string[]): { header: string[]; sections: Section[] } {
  const header: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;
  // How this document sets its headings: once its first two agree on capitals
  // or letter-spacing, a mixed-case look-alike is content, not a heading.
  const styles: HeadingStyle[] = [];

  lines.forEach((line, index) => {
    let rule = matchHeading(line);
    if (rule && current) {
      const established =
        styles.length >= 2 && styles[0] === styles[1] && styles[0] !== "mixed";
      const offStyle = established && headingStyle(line) === "mixed";
      // Inside a skills list, "Leadership" or "Languages" followed by more
      // short lines is an item or a group label.
      const key = headingKey(line.replace(/[:：]\s*$/, ""));
      const next = nextContent(lines, index + 1);
      const matchesStyle = established && headingStyle(line) === styles[0];
      const listy =
        !matchesStyle &&
        current.kind === "skills" &&
        (rule.kind === "skills" || rule.kind === "languages" || WEAK_HEADINGS.has(key)) &&
        next.length > 0 &&
        next.length <= 40 &&
        !findRange(next);
      if (offStyle || listy) rule = null;
    }
    if (rule) {
      styles.push(headingStyle(line));
      current = {
        kind: rule.kind,
        title: headingTitle(line),
        group: rule.group,
        lines: [],
      };
      sections.push(current);
      return;
    }

    // Only before the first heading, or outside a skills block (where
    // "Languages: Python" is a skill label, not a new section).
    const inline: ReturnType<typeof matchInlineHeading> =
      current?.kind === "skills" || current?.kind === "projects" ? null : matchInlineHeading(line);
    if (inline) {
      current = {
        kind: inline.rule.kind,
        title: inline.title,
        group: inline.rule.group,
        lines: [inline.rest],
      };
      sections.push(current);
      return;
    }

    (current ? current.lines : header).push(line);
  });
  return { header, sections };
}

/* ------------------------------------------------------------------ header */

const NOT_A_NAME = /\b(?:resume|résumé|curriculum|vitae|cv|profile|summary|contact|email|phone|address|page)\b/i;

function nameLike(text: string): boolean {
  const t = text.trim();
  if (t.length < 3 || t.length > 40 || /\d|@/.test(t) || NOT_A_NAME.test(t)) return false;
  return /^[\p{L}][\p{L}.'’-]*(?:\s+[\p{L}][\p{L}.'’-]*){1,3}$/u.test(t);
}

const CONTACT_LABEL =
  /^(?:e-?mail|phone|tel(?:ephone)?|mobile|cell|linkedin|github|website|web|portfolio|blog|location|address|based in)\s*[:\-–]\s*/i;

interface HeaderResult {
  fields: Partial<ResumeContent["personal"]>;
  summary: string;
  issues: ParseIssue[];
}

function parseHeader(lines: string[], wholeText: string): HeaderResult {
  const fields: HeaderResult["fields"] = {};
  const issues: ParseIssue[] = [];
  const leftovers: { text: string; whole: boolean }[] = [];

  const region = lines.filter((l) => !isBlank(l)).slice(0, 24);

  for (const raw of region) {
    let line = raw;
    let touched = false;

    const email = EMAIL_RE.exec(line);
    if (email && !fields.email) {
      fields.email = email[0];
      line = line.replace(email[0], " ");
      touched = true;
    }
    const linkedin = LINKEDIN_RE.exec(line);
    if (linkedin && !fields.linkedin) {
      fields.linkedin = linkedin[0].replace(/\/$/, "");
      line = line.replace(linkedin[0], " ");
      touched = true;
    }
    const github = GITHUB_RE.exec(line);
    if (github && !fields.github) {
      fields.github = github[0].replace(/\/$/, "");
      line = line.replace(github[0], " ");
      touched = true;
    }
    const url = ANY_URL_RE.exec(line) ?? URL_RE.exec(line.replace(CONTACT_LABEL, ""));
    if (url && !fields.website && !EMAIL_RE.test(url[0])) {
      fields.website = url[0].replace(/[/.,;]+$/, "");
      line = line.replace(url[0], " ");
      touched = true;
    }

    const phone = PHONE_RE.exec(line);
    if (phone && !fields.phone) {
      const digits = phone[0].replace(/\D/g, "");
      const isYears = /^(?:19|20)\d{2}\D+(?:19|20)\d{2}$/.test(phone[0].trim());
      if (digits.length >= 8 && digits.length <= 15 && !isYears && !RANGE_RE.test(phone[0])) {
        fields.phone = phone[0].trim();
        line = line.replace(phone[0], " ");
        touched = true;
      }
    }

    // Separators include OCR's readings of a bullet ("«", " + ").
    const segments = splitOutsideBrackets(line.replace(CONTACT_LABEL, " "), /[|•·●▪‣∙«»]/)
      .flatMap((s) => s.split(/\s+[–—+]\s+|\s{3,}/))
      .map((s) => s.replace(CONTACT_LABEL, "").replace(/[,;:\s]+$/, "").trim())
      .filter((s) => s.length > 1 && !/^[^\p{L}\d]+$/u.test(s));

    for (const segment of segments) {
      const labelled = /location|address|based in/i.test(raw.slice(0, 16));
      if (!fields.location && (labelled || looksLikeLocation(segment))) {
        fields.location = segment;
        continue;
      }
      leftovers.push({ text: segment, whole: !touched && segments.length === 1 });
    }
  }

  // Name: first name-shaped leftover that isn't a job title.
  const pool = leftovers.filter((l) => !isBullet(l.text));
  const nameIndex = pool.findIndex((l) => nameLike(l.text) && !TITLE_RE.test(l.text));
  let nameUncertain = false;
  let consumedName = -1;
  if (nameIndex !== -1) {
    fields.fullName = pool[nameIndex].text;
    consumedName = nameIndex;
  } else if (pool.length > 0 && nameLike(pool[0].text)) {
    fields.fullName = pool[0].text;
    consumedName = 0;
    nameUncertain = true;
  }

  // Job title: the nearest short line after the name, preferring a titled one.
  const after = consumedName === -1 ? pool : pool.slice(consumedName + 1);
  const candidates = after.filter(
    (l) => l.text.length <= 80 && !sentenceEnd(l.text) && !/\d{4}/.test(l.text),
  );
  const titled = candidates.find((l) => TITLE_RE.test(l.text));
  const nextShort = candidates.slice(0, 1)[0];
  const jobLine = titled ?? nextShort;
  if (jobLine) {
    fields.jobTitle = jobLine.text;
    if (!titled) {
      issues.push({
        path: "personal.jobTitle",
        level: "uncertain",
        message: "Guessed from the line under your name — please check it.",
      });
    }
  }

  // Header lines that were not claimed and read like prose become the summary.
  let summary = "";
  const prose = region.filter(
    (l) =>
      l.length > 90 &&
      !EMAIL_RE.test(l) &&
      !isBullet(l) &&
      l !== fields.fullName &&
      l !== fields.jobTitle,
  );
  if (prose.length > 0) summary = prose.join(" ");

  if (!fields.email) {
    // The address may sit below the header (e.g. in a footer).
    const anywhere = EMAIL_RE.exec(wholeText);
    if (anywhere) fields.email = anywhere[0];
  }

  if (!fields.fullName) {
    issues.push({
      path: "personal.fullName",
      level: "missing",
      message: "We couldn't find your name.",
    });
  } else if (nameUncertain) {
    issues.push({
      path: "personal.fullName",
      level: "uncertain",
      message: "Taken from the first line — please check it.",
    });
  }

  return { fields, summary, issues };
}

/* -------------------------------------------------- shared entry machinery */

interface DateInfo {
  start: string;
  end: string;
  current: boolean;
}

interface RawEntry {
  header: string[];
  date: DateInfo | null;
  body: string[];
}

/**
 * Bullets and paragraph text under an entry. A line that continues the
 * previous one (it follows with no blank line, and that line did not end the
 * sentence or this one starts lower-case) is the same bullet, wrapped.
 */
function toBullets(lines: string[]): string[] {
  const out: string[] = [];
  let gap = false;
  for (const raw of lines) {
    if (isBlank(raw)) {
      gap = true;
      continue;
    }
    if (isBullet(raw)) {
      const text = stripBullet(raw);
      if (text) out.push(text);
      gap = false;
      continue;
    }
    const text = raw.trim();
    const previous = out[out.length - 1];
    if (previous !== undefined && !gap && (!/[.!?:;]$/.test(previous) || /^[a-z(]/.test(text))) {
      out[out.length - 1] = `${previous} ${text}`;
    } else {
      out.push(text);
    }
    gap = false;
  }
  return out;
}

/** Blocks of non-blank lines. */
function blocks(lines: string[]): string[][] {
  const out: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (isBlank(line)) {
      if (current.length) out.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) out.push(current);
  return out;
}

/**
 * Split a section into entries anchored on date ranges. Handles the three
 * layouts résumés actually use:
 *   Title / Company / Dates / bullets      (header above the date)
 *   Dates / Title at Company / bullets     (date first)
 *   Title, Company — Dates / bullets       (everything on one line)
 */
function splitDatedEntries(lines: string[]): RawEntry[] {
  const kind = lines.map((l) =>
    isBlank(l) ? "blank" : isBullet(l) ? "bullet" : findRange(l) ? "date" : "text",
  );
  const dateIdx = kind.flatMap((k, i) => (k === "date" ? [i] : []));

  if (dateIdx.length === 0) {
    // No dates at all: fall back to blank-line blocks.
    return blocks(lines).map((block) => {
      const head: string[] = [];
      let i = 0;
      while (i < block.length && i < 2 && isHeaderCandidate(block[i])) {
        head.push(block[i]);
        i += 1;
      }
      return { header: head, date: null, body: block.slice(i) };
    });
  }

  interface Anchor {
    start: number;
    bodyStart: number;
    header: string[];
    date: DateInfo;
  }
  const anchors: Anchor[] = [];

  dateIdx.forEach((d, k) => {
    const range = findRange(lines[d]);
    if (!range) return;
    const remainder = removeSpan(lines[d], range.index, range.length);
    const limit = k > 0 ? dateIdx[k - 1] : -1;

    const before: string[] = [];
    for (let j = d - 1; j > limit && before.length < 2; j -= 1) {
      if (kind[j] !== "text" || !isHeaderCandidate(lines[j])) break;
      before.unshift(lines[j]);
    }

    const after: string[] = [];
    let bodyStart = d + 1;
    if (before.length === 0 && !remainder) {
      for (let j = d + 1; j < lines.length && after.length < 2; j += 1) {
        if (kind[j] !== "text" || !isHeaderCandidate(lines[j])) break;
        after.push(lines[j]);
        bodyStart = j + 1;
      }
    } else if (before.length + (remainder ? 1 : 0) === 1) {
      // Title / dates / Company: a short line wedged between the date and the
      // first bullet is the rest of the header (common when a right-aligned
      // date is read as its own line).
      const next = d + 1;
      const after2 = kind[next + 1];
      if (
        kind[next] === "text" &&
        isHeaderCandidate(lines[next]) &&
        (after2 === undefined || after2 === "bullet" || after2 === "blank" || after2 === "date")
      ) {
        after.push(lines[next]);
        bodyStart = next + 1;
      }
    }

    anchors.push({
      start: d - before.length,
      bodyStart,
      header: [...before, ...(remainder ? [remainder] : []), ...after],
      date: { start: range.start, end: range.end, current: range.current },
    });
  });

  return anchors.map((anchor, i) => {
    const end = i + 1 < anchors.length ? anchors[i + 1].start : lines.length;
    return {
      header: anchor.header,
      date: anchor.date,
      body: lines.slice(anchor.bodyStart, Math.max(anchor.bodyStart, end)),
    };
  });
}

/* ---------------------------------------------------------------- role line */

interface Role {
  position: string;
  company: string;
  location: string;
  guessed: boolean;
}

const SEGMENTS = /\s*\|\s*|\s*[·•]\s*|\s+[–—-]\s+|\s+@\s+|\s+\bat\b\s+/i;

function parseRole(header: string[]): Role {
  // "Title, Company" on one line has no stronger separator; split on the
  // first comma only if the left side is clearly a title.
  const segments: string[] = [];
  for (const line of header) {
    const parts = line.split(SEGMENTS).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 1) {
      const comma = /^([^,]+?),\s*(.+)$/.exec(parts[0]);
      if (comma && TITLE_RE.test(comma[1]) && !TITLE_RE.test(comma[2])) {
        segments.push(comma[1], comma[2]);
        continue;
      }
    }
    segments.push(...parts);
  }

  let location = "";
  const classified = segments.map((text) => {
    let value = text;
    // A segment that is itself a place ("Bengaluru, India") is not peeled.
    if (!looksLikeLocation(value) && (COMPANY_RE.test(value) || !TITLE_RE.test(value))) {
      const peeled = splitTrailingLocation(value);
      if (peeled.location && !location) {
        location = peeled.location;
        value = peeled.rest;
      }
    }
    const title = TITLE_RE.test(value);
    const company = COMPANY_RE.test(value);
    const place = !title && !company && looksLikeLocation(value);
    return { text: value, title, company, place };
  });

  const used = new Set<number>();
  const take = (predicate: (c: (typeof classified)[number]) => boolean) => {
    const index = classified.findIndex((c, i) => !used.has(i) && predicate(c));
    if (index !== -1) used.add(index);
    return index === -1 ? "" : classified[index].text;
  };

  if (!location) location = take((c) => c.place);

  let guessed = false;
  let position = take((c) => c.title && !c.company) || take((c) => c.title);
  let company = take((c) => c.company);
  if (!position) {
    position = take((c) => !c.place);
    if (position) guessed = true;
  }
  if (!company) {
    company = take((c) => !c.place && !c.title);
    if (company && classified.length > 1) guessed = guessed || !position;
  }
  if (!location) location = take(() => true);
  if (location && !looksLikeLocation(location) && classified.length > 2) {
    // A third unclassified segment is only a place if it looks like one.
    location = "";
  }

  return { position, company, location, guessed };
}

/* ---------------------------------------------------------------- experience */

function parseExperience(
  lines: string[],
  kind: "experience" | "volunteer",
  issues: ParseIssue[],
): (ExperienceItem | VolunteerItem)[] {
  const out: (ExperienceItem | VolunteerItem)[] = [];

  for (const raw of splitDatedEntries(lines)) {
    if (raw.header.length === 0 && raw.body.every(isBlank)) continue;
    const role = parseRole(raw.header);
    const id = newId();
    const date = raw.date ?? { start: "", end: "", current: false };
    const bullets = toBullets(raw.body);

    const flag = (field: string, level: IssueLevel, message: string) =>
      issues.push({ path: `${kind}.${id}.${field}`, level, message });

    const primaryField = kind === "experience" ? "position" : "role";
    const orgField = kind === "experience" ? "company" : "organization";

    if (!role.position) flag(primaryField, "missing", "Job title not found.");
    else if (role.guessed) flag(primaryField, "uncertain", "Job title and company were guessed — please check them.");
    if (!role.company) flag(orgField, "missing", "Company not found.");
    else if (role.guessed) flag(orgField, "uncertain", "Please check the company name.");
    if (!date.start && !date.current) flag("startDate", "missing", "Dates not found.");

    if (kind === "experience") {
      out.push({
        id,
        position: role.position,
        company: role.company,
        location: role.location,
        startDate: date.start,
        endDate: date.end,
        current: date.current,
        bullets,
      } satisfies ExperienceItem);
    } else {
      out.push({
        id,
        role: role.position,
        organization: role.company,
        startDate: date.start,
        endDate: date.end,
        current: date.current,
        bullets,
      } satisfies VolunteerItem);
    }
  }
  return out;
}

/* ----------------------------------------------------------------- education */

function lineHasDegree(line: string) {
  return DEGREE_RE.test(line);
}
function lineHasInstitution(line: string) {
  return INSTITUTION_RE.test(line);
}

function educationBlocks(lines: string[]): string[][] {
  const result: string[][] = [];
  for (const block of blocks(lines)) {
    if (block.length <= 1) {
      result.push(block);
      continue;
    }
    // A run without blank lines may hold several entries: start a new one when
    // a second institution (or degree) line appears.
    let current: string[] = [];
    let hasInstitution = false;
    let hasDegree = false;
    for (const line of block) {
      const inst = lineHasInstitution(line);
      const deg = lineHasDegree(line);
      const startsNew =
        current.length > 0 &&
        !isBullet(line) &&
        ((inst && hasInstitution) || (deg && hasDegree && !inst));
      if (startsNew) {
        result.push(current);
        current = [];
        hasInstitution = false;
        hasDegree = false;
      }
      current.push(line);
      hasInstitution = hasInstitution || inst;
      hasDegree = hasDegree || deg;
    }
    if (current.length) result.push(current);
  }
  return result;
}

function parseEducation(lines: string[], issues: ParseIssue[]): EducationItem[] {
  const out: EducationItem[] = [];

  for (const block of educationBlocks(lines)) {
    const id = newId();
    let start = "";
    let end = "";
    const texts: string[] = [];
    const extra: string[] = [];

    for (const line of block) {
      if (isBullet(line)) {
        extra.push(line);
        continue;
      }
      let text = line;
      const range = findRange(text);
      if (range) {
        start = range.start;
        end = range.current ? "" : range.end;
        text = removeSpan(text, range.index, range.length);
      } else {
        const single = DATE_RE.exec(text);
        if (single && !end) {
          end = toYearMonth(single[1]);
          text = removeSpan(text, single.index, single[0].length);
        }
      }
      if (text) texts.push(text);
    }

    let degree = "";
    let institution = "";
    let location = "";
    const rest: string[] = [];

    // Atomic parts, in reading order: "BSc Physics, University of X, Leeds, UK".
    const parts = texts.flatMap((text) =>
      splitOutsideBrackets(text, /[|,·•]/).flatMap((s) => s.split(/\s+[–—-]\s+/)),
    );
    let last: "degree" | "institution" | "location" | null = null;
    for (const part of parts) {
      const inst = lineHasInstitution(part);
      const deg = lineHasDegree(part);
      if (inst && !institution) {
        institution = part;
        last = "institution";
      } else if (deg && !degree) {
        degree = part;
        last = "degree";
      } else if (last === "institution" && !location && /^[\p{L}][\p{L}.'’ -]{1,30}$/u.test(part) && words(part).length <= 3) {
        location = part;
        last = "location";
      } else if (last === "location" && (/^[A-Z]{2}$/.test(part) || COUNTRIES.has(part.toLowerCase()))) {
        location = `${location}, ${part}`;
      } else {
        rest.push(part);
        last = null;
      }
    }
    // Without degree or school words, the first parts are still the likeliest
    // degree and school — unless the block is only details ("GPA: 3.8").
    const detailsOnly =
      !degree &&
      !institution &&
      rest.every((r) => /^(?:gpa|cgpa|grade|honou?rs|coursework|relevant coursework|thesis|dissertation|minor|major)\b/i.test(r));
    if (!detailsOnly) {
      if (!degree && !institution && rest.length) degree = rest.shift() ?? "";
      if (!institution && rest.length) institution = rest.shift() ?? "";
      if (!degree && rest.length && !lineHasInstitution(rest[0])) degree = rest.shift() ?? "";
    }

    const bullets = [...rest, ...extra].map(stripBullet).filter(Boolean);
    if (!degree && !institution && bullets.length === 0) continue;
    // Details separated from their entry by a gap ("GPA: 3.8") belong to it.
    if (!degree && !institution && !start && !end && out.length > 0) {
      out[out.length - 1].bullets.push(...bullets);
      continue;
    }

    if (!institution) {
      issues.push({ path: `education.${id}.institution`, level: "missing", message: "School not found." });
    }
    if (!degree) {
      issues.push({ path: `education.${id}.degree`, level: "missing", message: "Degree not found." });
    }
    if (!end && !start) {
      issues.push({ path: `education.${id}.endDate`, level: "missing", message: "Graduation date not found." });
    }

    out.push({ id, degree, institution, location, startDate: start, endDate: end, bullets });
  }
  return out;
}

/* -------------------------------------------------------------------- skills */

function splitItems(text: string): string[] {
  return splitOutsideBrackets(text, LIST_SEPARATORS)
    .map((s) => s.replace(/^[-–—]\s+/, "").replace(/\.$/, "").trim())
    .filter((s) => s.length > 0 && s.length <= 60);
}

function parseSkills(lines: string[], defaultGroup: string | undefined): SkillGroup[] {
  const groups: SkillGroup[] = [];
  const byName = new Map<string, SkillGroup>();

  const add = (name: string, items: string[]) => {
    if (items.length === 0) return;
    const key = name.toLowerCase();
    let group = byName.get(key);
    if (!group) {
      group = { id: newId(), name, items: [] };
      byName.set(key, group);
      groups.push(group);
    }
    for (const item of items) {
      if (!group.items.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
        group.items.push(item);
      }
    }
  };

  const groupsOfLines = blocks(lines);
  for (const block of groupsOfLines) {
    let name = defaultGroup ?? "";
    let body = block;
    // A stacked group: "Languages" / "Python" / "Go" … — a short label line
    // over one-item lines, in a section with several such groups (or ending
    // in a colon, which is unambiguous).
    const first = stripBullet(block[0]);
    const oneItemLines = block.slice(1).every((l) => splitItems(stripBullet(l)).length <= 1);
    // A skills phrase on its own line ("Soft skills", "Languages") always
    // labels what follows it.
    const knownLabel = (() => {
      const rule = HEADINGS.get(headingKey(first.replace(/[:：]\s*$/, "")));
      return !!rule && (rule.kind === "skills" || rule.kind === "languages");
    })();
    const plainLabel =
      !isBullet(block[0]) && !LIST_SEPARATORS.test(first) && first.length <= 30;
    if (
      plainLabel &&
      ((knownLabel && block.length >= 2) ||
        (block.length >= 3 && oneItemLines && (first.endsWith(":") || groupsOfLines.length >= 2)))
    ) {
      name = first.replace(/[:：]\s*$/, "");
      body = block.slice(1);
    }
    for (const raw of body) {
      const line = stripBullet(raw);
      const labelled = /^([^:：|]{2,40}?)\s*[:：|]\s*(.+)$/.exec(line);
      if (labelled && !/https?:/i.test(labelled[1])) {
        add(labelled[1].trim(), splitItems(labelled[2]));
      } else {
        add(name, splitItems(line));
      }
    }
  }
  return groups;
}

/* ------------------------------------------------------------ certifications */

function parseDatedLine(line: string) {
  let text = line;
  let date = "";
  const single = DATE_RE.exec(text);
  const range = findRange(text);
  if (range) {
    date = range.end || range.start;
    text = removeSpan(text, range.index, range.length);
  } else if (single) {
    date = toYearMonth(single[1]);
    text = removeSpan(text, single.index, single[0].length);
  }
  return { text: text.trim(), date };
}

const HAS_SEPARATOR = /\s\|\s|\s[–—-]\s|\(|,\s/;

/**
 * "AWS Certified Solutions / Architect / Amazon Web Services / 2021": in a
 * narrow column one certification spans several lines, with the issuer and
 * the date on lines of their own. A block that ends in a bare date and whose
 * other lines carry no separators is one entry: name lines, then the issuer.
 */
function mergeCertificationBlock(block: string[]): CertificationItem | null {
  if (block.length < 2) return null;
  const last = stripBullet(block[block.length - 1]);
  const dateOnly = parseDatedLine(last);
  if (dateOnly.text || !dateOnly.date) return null;
  const texts = block.slice(0, -1).map(stripBullet);
  if (texts.some((t) => HAS_SEPARATOR.test(t) || DATE_RE.test(t))) return null;
  const issuer = texts.length >= 2 ? texts[texts.length - 1] : "";
  const name = (texts.length >= 2 ? texts.slice(0, -1) : texts).join(" ");
  return { id: newId(), name, issuer, date: dateOnly.date, link: "" };
}

function parseCertifications(lines: string[]): CertificationItem[] {
  const out: CertificationItem[] = [];
  const pending: string[] = [];
  for (const block of blocks(lines)) {
    const merged = mergeCertificationBlock(block);
    if (merged) out.push(merged);
    else pending.push(...block, "");
  }
  for (const raw of pending) {
    if (isBlank(raw)) continue;
    const { text, date } = parseDatedLine(stripBullet(raw));
    const url = ANY_URL_RE.exec(text);
    const clean = url ? text.replace(url[0], "").trim() : text;

    // A line that is only a date belongs to the entry above it.
    if (!clean && date && out.length > 0 && !out[out.length - 1].date) {
      out[out.length - 1].date = date;
      continue;
    }
    if (!clean) continue;

    let name = clean;
    let issuer = "";
    const paren = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(clean);
    if (paren) {
      name = paren[1];
      issuer = paren[2];
    } else {
      const parts = clean.split(/\s*\|\s*|\s+[–—-]\s+|,\s+(?=[A-Z])/);
      if (parts.length >= 2) {
        name = parts[0];
        issuer = parts.slice(1).join(", ");
      }
    }
    out.push({
      id: newId(),
      name: name.replace(/[,;:\-–—\s]+$/, ""),
      issuer: issuer.replace(/[,;:\-–—\s]+$/, ""),
      date,
      link: url ? url[0] : "",
    });
  }
  return out;
}

/* ----------------------------------------------------------------- languages */

function parseLanguages(lines: string[]): LanguageItem[] {
  const out: LanguageItem[] = [];
  for (const raw of lines) {
    if (isBlank(raw)) continue;
    for (const item of splitOutsideBrackets(stripBullet(raw), /[,;|•·●▪‣∙]/)) {
      const paren = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(item);
      let name = item;
      let level = "";
      if (paren) {
        name = paren[1];
        level = paren[2];
      } else {
        const split = /^(.*?)\s*[:\-–—]\s*(.+)$/.exec(item);
        if (split) {
          name = split[1];
          level = split[2];
        } else {
          const trailing = LEVEL_RE.exec(item);
          if (trailing && trailing.index > 0) {
            name = item.slice(0, trailing.index);
            level = item.slice(trailing.index);
          }
        }
      }
      name = name.trim();
      const previous = out[out.length - 1];
      // "Spanish; Professional" — a bare proficiency belongs to the language before it.
      if (!level && previous && !previous.level && LEVEL_RE.exec(name)?.[0].length === name.length) {
        previous.level = name;
        continue;
      }
      if (name && name.length <= 30 && words(name).length <= 3) {
        out.push({ id: newId(), name, level: level.trim() });
      }
    }
  }
  return out;
}

/* -------------------------------------------------------------------- awards */

function parseAwards(lines: string[]): AwardItem[] {
  const out: AwardItem[] = [];
  let lastWasEntry = false;
  let gap = false;

  for (const raw of lines) {
    if (isBlank(raw)) {
      gap = true;
      continue;
    }
    const bulleted = isBullet(raw);
    const line = stripBullet(raw);
    const previous = out[out.length - 1];

    // Un-bulleted prose directly under an award is its description.
    if (previous && lastWasEntry && !gap && !bulleted && /^[a-z]/.test(line)) {
      previous.description = `${previous.description} ${line}`.trim();
      continue;
    }

    const { text, date } = parseDatedLine(line);
    if (!text && date && previous && !previous.date) {
      previous.date = date;
      continue;
    }
    if (!text) continue;

    const parts = text.split(/\s*\|\s*|\s+[–—-]\s+|:\s+|,\s+(?=[A-Z])/);
    const title = parts[0].trim();
    const issuer = parts.length > 1 ? parts.slice(1).join(", ").trim() : "";
    out.push({ id: newId(), title, issuer, date, description: "" });
    lastWasEntry = true;
    gap = false;
  }
  return out;
}

/* ------------------------------------------------------------------ projects */

const TECH_LABEL = /^(?:tech(?:nologies|nology)?(?:\s+stack)?|stack|built\s+with|tools|technologies\s+used)\s*[:\-–]\s*(.+)$/i;

function parseProjectSubtitle(line: string): { technologies: string[]; link: string } | null {
  const url = ANY_URL_RE.exec(line) ?? URL_RE.exec(line);
  const rest = (url ? line.replace(url[0], " ") : line).replace(/[·•|]/g, ",");
  const items = splitItems(rest);
  const listLike =
    items.length > 0 &&
    items.every((item) => words(item).length <= 3) &&
    !sentenceEnd(line) &&
    (items.length >= 2 || !!url);
  if (!listLike && !(url && items.length === 0)) return null;
  return { technologies: listLike ? items : [], link: url ? url[0].replace(/[).,;]+$/, "") : "" };
}

function parseProjects(lines: string[]): ProjectItem[] {
  const out: ProjectItem[] = [];
  let current: ProjectItem | null = null;
  let body: string[] = [];
  let boundary = true;

  const flush = () => {
    if (current) current.bullets = toBullets(body);
    body = [];
  };

  for (const raw of lines) {
    if (isBlank(raw)) {
      boundary = true;
      body.push(raw);
      continue;
    }

    const tech = TECH_LABEL.exec(stripBullet(raw));
    if (tech && current) {
      current.technologies.push(...splitItems(tech[1]));
      continue;
    }

    const startsProject = boundary && !isBullet(raw) && isHeaderCandidate(raw) && !findRange(raw);
    if (startsProject || (!current && !isBullet(raw))) {
      flush();
      const url = ANY_URL_RE.exec(raw) ?? URL_RE.exec(raw);
      const text = url ? raw.replace(url[0], " ") : raw;
      const parts = text
        .split(/\s*\|\s*|\s+[–—-]\s+|\s*[([]/)
        .map((s) => s.replace(/[)\]]\s*$/, "").replace(/[,;:\s]+$/, "").trim())
        .filter(Boolean);
      current = {
        id: newId(),
        name: parts[0] ?? raw.trim(),
        link: url ? url[0].replace(/[).,;]+$/, "") : "",
        technologies: parts.slice(1).flatMap((p) => (/,/.test(p) || parts.length > 1 ? splitItems(p) : [])),
        bullets: [],
      };
      out.push(current);
      boundary = false;
      continue;
    }

    if (!current) {
      current = { id: newId(), name: "", link: "", technologies: [], bullets: [] };
      out.push(current);
    }
    // The line right under a project name may be its subtitle:
    // "React, Node.js · github.com/you/app".
    const subtitle = !isBullet(raw) && body.every(isBlank) && parseProjectSubtitle(raw);
    if (subtitle) {
      current.technologies.push(...subtitle.technologies);
      if (subtitle.link && !current.link) current.link = subtitle.link;
      continue;
    }
    body.push(raw);
    boundary = false;
  }
  flush();
  return out.filter((p) => p.name || p.bullets.length);
}

/* ------------------------------------------------------------------- custom */

function parseCustom(title: string, lines: string[]): CustomSection {
  const entries: CustomEntry[] = [];
  for (const block of blocks(lines)) {
    const first = block[0];
    // A run of short plain lines ("Chess", "Rock climbing") is a list of items;
    // a title followed by longer lines is one entry with details.
    const looksLikeList = block.every((l) => !isBullet(l) && l.trim().length <= 40);
    if (!isBullet(first) && block.length > 1 && !looksLikeList) {
      entries.push({
        id: newId(),
        heading: first.trim(),
        subheading: "",
        date: "",
        bullets: toBullets(block.slice(1)),
      });
    } else {
      for (const line of block) {
        entries.push({ id: newId(), heading: stripBullet(line), subheading: "", date: "", bullets: [] });
      }
    }
  }
  return { id: newId(), title, entries };
}

/* ---------------------------------------------------------------------- main */

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

export function parseResumeText(text: string): ParseResult {
  const lines = normalise(text);
  const issues: ParseIssue[] = [];
  const content = emptyContent();
  const found: SectionKind[] = [];

  const { header, sections } = splitSections(lines);
  // A "Contact" block is part of the header, wherever it sits on the page.
  const contactLines = sections.filter((s) => s.kind === "contact").flatMap((s) => s.lines);
  const head = parseHeader([...header, ...contactLines], text);
  Object.assign(content.personal, head.fields);
  issues.push(...head.issues);

  const seenSummary = sections.some((s) => s.kind === "summary");
  if (!seenSummary && head.summary) {
    content.summary = head.summary;
    issues.push({
      path: "summary",
      level: "uncertain",
      message: "Taken from the text at the top of your resume — please check it.",
    });
  }

  for (const section of sections) {
    const { kind, lines: body } = section;
    if (kind === "contact" || body.every(isBlank)) continue;
    found.push(kind);

    switch (kind) {
      case "summary": {
        const paragraphs = blocks(body).map((b) => b.map((l) => l.trim()).join(" "));
        content.summary = [content.summary, ...paragraphs].filter(Boolean).join("\n");
        break;
      }
      case "experience":
        content.experience.push(...(parseExperience(body, "experience", issues) as ExperienceItem[]));
        break;
      case "volunteer":
        content.volunteer.push(...(parseExperience(body, "volunteer", issues) as VolunteerItem[]));
        break;
      case "education":
        content.education.push(...parseEducation(body, issues));
        break;
      case "skills":
        content.skills.push(
          ...parseSkills(
            body,
            section.group ??
              (/technical|tech stack|technologies/i.test(section.title) ? "Technical skills" : undefined),
          ),
        );
        break;
      case "projects":
        content.projects.push(...parseProjects(body));
        break;
      case "certifications":
        content.certifications.push(...parseCertifications(body));
        break;
      case "languages": {
        const parsed = parseLanguages(body);
        const spoken = parsed.filter((l) =>
          HUMAN_LANGUAGES.has(l.name.toLowerCase().replace(/\s*\(.*$/, "").trim()),
        ).length;
        const previous = sections[sections.indexOf(section) - 1];
        // "Languages" right after Skills, listing Python and Go, is a skill group.
        if (parsed.length > 0 && spoken / parsed.length < 0.5 && previous?.kind === "skills") {
          content.skills.push(...parseSkills(body, headingTitle(section.title)));
          found.push("skills");
        } else {
          content.languages.push(...parsed);
        }
        break;
      }
      case "awards":
        content.awards.push(...parseAwards(body));
        break;
      default: {
        const custom = parseCustom(titleCase(section.title), body);
        if (custom.entries.length) {
          content.custom.push(custom);
          issues.push({
            path: `custom.${custom.id}`,
            level: "uncertain",
            message: `"${custom.title}" isn't a standard section, so it was kept as its own section.`,
          });
        }
      }
    }
  }

  // Merge skill groups that share a name across multiple sections.
  const merged = new Map<string, SkillGroup>();
  for (const group of content.skills) {
    const key = group.name.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      for (const item of group.items) {
        if (!existing.items.some((i) => i.toLowerCase() === item.toLowerCase())) existing.items.push(item);
      }
    } else {
      merged.set(key, group);
    }
  }
  content.skills = [...merged.values()];

  // A skill group called "Languages" that lists English and Spanish is the
  // Languages section, placed under Skills by the layout.
  content.skills = content.skills.filter((group) => {
    if (!/^(?:spoken\s+)?languages?$/i.test(group.name.trim())) return true;
    const spoken = group.items.filter((item) =>
      HUMAN_LANGUAGES.has(item.toLowerCase().replace(/\s*[(:\-–—].*$/, "").trim()),
    ).length;
    if (group.items.length === 0 || spoken / group.items.length < 0.5) return true;
    content.languages.push(...parseLanguages(group.items));
    if (!found.includes("languages")) found.push("languages");
    return false;
  });

  // Label the soft-skill group consistently when the source used a soft-skill word.
  for (const group of content.skills) {
    if (group.name && SOFT_SKILL_HINT_RE.test(group.name) && /^soft/i.test(group.name)) {
      group.name = group.name.replace(/^soft skills?$/i, "Soft skills");
    }
  }

  // Absent core details, so the review screen can ask for them.
  const need = (path: string, present: boolean, message: string) => {
    if (!present && !issues.some((i) => i.path === path)) {
      issues.push({ path, level: "missing", message });
    }
  };
  need("personal.email", !!content.personal.email, "No email address found.");
  need("personal.phone", !!content.personal.phone, "No phone number found.");
  need("personal.location", !!content.personal.location, "No location found.");
  need("personal.jobTitle", !!content.personal.jobTitle, "No professional title found.");
  need("section.experience", content.experience.length > 0, "No work experience found.");
  need("section.education", content.education.length > 0, "No education found.");
  need("section.skills", content.skills.length > 0, "No skills found.");
  need("summary", !!content.summary, "No professional summary found.");

  return { content, issues, found: [...new Set(found)] };
}
