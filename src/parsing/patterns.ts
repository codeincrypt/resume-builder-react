/**
 * The rules the parser matches against: section-heading vocabulary, date and
 * contact patterns, and the word lists used to tell a job title from a company
 * from a place. Everything is plain data and regular expressions — no model.
 */

export type SectionKind =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "awards"
  | "volunteer"
  | "contact"
  | "custom";

export interface HeadingRule {
  kind: SectionKind;
  /** Pre-fills the skill group's name ("Soft skills"). */
  group?: string;
}

const h = (kind: SectionKind, ...titles: string[]) =>
  titles.map((t) => [t, { kind }] as const);

/** Normalised heading text -> what it opens. */
export const HEADINGS = new Map<string, HeadingRule>([
  ...h("summary", "summary", "professional summary", "career summary", "executive summary",
    "profile", "professional profile", "personal profile", "about me", "about",
    "objective", "career objective", "personal statement", "overview", "summary of qualifications",
    "professional overview", "core profile"),
  ...h("experience", "experience", "work experience", "professional experience", "employment",
    "employment history", "work history", "career history", "relevant experience",
    "professional background", "employment experience", "experience and internships",
    "work experience and internships", "internships", "industry experience", "career experience"),
  ...h("education", "education", "academic background", "education and training",
    "academic qualifications", "qualifications", "educational background", "academics",
    "education and qualifications", "academic history", "educational qualifications",
    "education and certifications"),
  ...h("skills", "skills", "technical skills", "core competencies", "key skills", "competencies",
    "skills and expertise", "areas of expertise", "expertise", "technologies", "tech stack",
    "technical proficiencies", "professional skills", "skills summary", "core skills",
    "technical expertise", "skills and tools", "tools and technologies", "technical summary"),
  ["soft skills", { kind: "skills", group: "Soft skills" }],
  ["interpersonal skills", { kind: "skills", group: "Soft skills" }],
  ["personal skills", { kind: "skills", group: "Soft skills" }],
  ...h("projects", "projects", "personal projects", "selected projects", "key projects",
    "academic projects", "project experience", "open source", "open source contributions",
    "side projects", "notable projects"),
  ...h("certifications", "certifications", "certificates", "licenses", "licences",
    "licenses and certifications", "certifications and licenses", "courses", "training",
    "professional development", "training and certifications", "certification",
    "courses and certifications", "licenses and certificates"),
  ...h("languages", "languages", "language skills", "spoken languages", "language proficiency"),
  ...h("awards", "awards", "honors", "honours", "awards and honors", "achievements",
    "accomplishments", "awards and achievements", "honors and awards", "scholarships",
    "awards and recognition", "recognition", "key achievements"),
  ...h("volunteer", "volunteer", "volunteering", "volunteer experience", "community involvement",
    "community service", "volunteer work", "extracurricular activities", "extracurriculars",
    "leadership and activities", "volunteer and leadership", "leadership"),
  // Contact blocks (common in side rails) feed the header parser.
  ...h("contact", "contact", "contacts", "contact information", "contact details", "contact info",
    "personal details", "personal information", "personal info", "get in touch"),
  // Recognised but kept as their own, named sections rather than discarded.
  ...h("custom", "interests", "hobbies", "hobbies and interests", "references", "publications",
    "patents", "research", "speaking", "affiliations", "memberships", "professional affiliations",
    "additional information", "additional", "other", "activities", "talks", "presentations",
    "interests and hobbies"),
]);

/* ------------------------------------------------------------------- dates */

const MONTH =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";
const YEAR = "(?:19|20)\\d{2}";
const SEASON = "(?:spring|summer|fall|autumn|winter)";
const DATE = `(?:${MONTH},?\\s+${YEAR}|\\d{1,2}[/.-]${YEAR}|${YEAR}[/.-]\\d{1,2}|${SEASON}\\s+${YEAR}|${YEAR})`;
const PRESENT = "(?:present|current|currently|now|today|ongoing|till\\s+date|to\\s+date)";

export const RANGE_RE = new RegExp(
  `(?<![\\w/])(${DATE})\\s*(?:-|–|—|‑|to|until|through|till)\\s*(${DATE}|${PRESENT})(?![\\w/])`,
  "i",
);
export const DATE_RE = new RegExp(`(?<![\\w/])(${DATE})(?![\\w/])`, "i");

const MONTH_NUMBER: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/**
 * `Jan 2020`, `03/2020`, `2020-03` -> `YYYY-MM`; `2020` and `Summer 2020`
 * -> `2020` (a season is not a month, so none is invented). "" if unparseable.
 */
export function toYearMonth(raw: string): string {
  const s = raw.trim().toLowerCase().replace(/[.,]/g, "");

  const named = s.match(new RegExp(`^([a-z]{3,9})\\s+(${YEAR})$`));
  if (named) {
    const month = MONTH_NUMBER[named[1].slice(0, 3)];
    if (month && !new RegExp(`^${SEASON}$`).test(named[1])) return `${named[2]}-${month}`;
    return named[2];
  }
  const monthFirst = s.match(new RegExp(`^(\\d{1,2})[/.-](${YEAR})$`));
  if (monthFirst) {
    const month = Number(monthFirst[1]);
    return month >= 1 && month <= 12 ? `${monthFirst[2]}-${String(month).padStart(2, "0")}` : monthFirst[2];
  }
  const yearFirst = s.match(new RegExp(`^(${YEAR})[/.-](\\d{1,2})$`));
  if (yearFirst) {
    const month = Number(yearFirst[2]);
    return month >= 1 && month <= 12 ? `${yearFirst[1]}-${String(month).padStart(2, "0")}` : yearFirst[1];
  }
  if (new RegExp(`^${YEAR}$`).test(s)) return s;
  const seasonal = s.match(new RegExp(`(${YEAR})`));
  return seasonal ? seasonal[1] : "";
}

export const PRESENT_RE = new RegExp(`^${PRESENT}$`, "i");

/* ----------------------------------------------------------------- contact */

export const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
export const LINKEDIN_RE =
  /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub|company)\/[\w\-%.]+\/?/i;
export const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-.]+(?:\/[\w\-.]+)?\/?/i;

const TLD =
  "com|org|net|io|dev|me|co|ai|app|tech|design|xyz|info|biz|edu|gov|in|uk|us|ca|au|de|fr|es|it|nl|se|no|fi|dk|jp|kr|cn|sg|br|mx|nz|za|ae|pt|ie|ch|at|pl|ru|studio|page|site|online|work|cv";
export const URL_RE = new RegExp(
  `(?:https?:\\/\\/)?(?:www\\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9-]+)*\\.(?:${TLD})(?:\\/[^\\s,;|)]*)?`,
  "i",
);
export const ANY_URL_RE = /https?:\/\/[^\s,;|)]+|www\.[^\s,;|)]+/i;

export const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/;

/* ---------------------------------------------------------------- bullets */

/** List markers, including the shapes OCR turns a bullet into ("+", "=", "«"). */
export const BULLET_RE =
  /^\s*(?:[•●○◦▪■□▫‣⁃∙·►▶➤➢✓✔❖◆◇*\uF0B7\uF0A7\uF076\uF0D8]|[-–—]\s+|[+=«»]+\s+|\d{1,2}[.)]\s+)\s*/;

/* ------------------------------------------------------------- word lists */

export const TITLE_RE = new RegExp(
  "\\b(?:engineer|developer|manager|director|analyst|designer|consultant|specialist|coordinator|" +
    "administrator|architect|lead|head|officer|intern|internship|assistant|associate|executive|" +
    "president|vp|vice|founder|co-?founder|owner|scientist|researcher|technician|supervisor|" +
    "representative|teacher|professor|lecturer|instructor|nurse|accountant|programmer|tester|qa|" +
    "sre|devops|writer|editor|strategist|advisor|adviser|trainee|clerk|agent|chef|cook|driver|" +
    "technologist|planner|buyer|auditor|attorney|lawyer|paralegal|therapist|pharmacist|physician|" +
    "doctor|surgeon|principal|partner|chief|ceo|cto|cfo|coo|cio|freelancer|contractor|apprentice|" +
    "volunteer|mentor|tutor|captain|operator|recruiter|promoter|generalist|fellow|member|" +
    "producer|animator|illustrator|photographer|translator|broker|dispatcher|cashier|barista|" +
    "bartender|server|receptionist|secretary|machinist|electrician|mechanic|welder|foreman|" +
    "sales|marketing)\\b",
  "i",
);

export const COMPANY_RE = new RegExp(
  "\\b(?:inc|llc|ltd|limited|corp|corporation|co|company|gmbh|pvt|plc|ag|sa|sarl|bv|oy|ab|as|" +
    "technologies|technology|solutions|systems|labs|group|holdings|partners|associates|" +
    "consulting|services|industries|bank|university|college|institute|school|hospital|" +
    "agency|studio|studios|foundation|association|council|ministry|department|" +
    "software|networks|digital|media|global|international|enterprises|ventures|" +
    "capital|healthcare|logistics|airlines|motors|labs|works)\\b\\.?",
  "i",
);

export const DEGREE_RE = new RegExp(
  "\\b(?:bachelor(?:'?s)?|master(?:'?s)?|doctor(?:ate)?|ph\\.?\\s?d|associate(?:'?s)?|diploma|" +
    "certificate|b\\.?\\s?sc?\\.?|b\\.?\\s?a\\.?|b\\.?\\s?e\\.?|b\\.?\\s?tech|b\\.?\\s?com|b\\.?\\s?eng|" +
    "b\\.?\\s?b\\.?\\s?a|m\\.?\\s?sc?\\.?|m\\.?\\s?a\\.?|m\\.?\\s?e\\.?|m\\.?\\s?tech|m\\.?\\s?b\\.?\\s?a|" +
    "m\\.?\\s?eng|m\\.?\\s?com|m\\.?\\s?phil|llb|llm|mbbs|md|jd|bca|mca|hnd|a-?levels?|gcse|" +
    "high school|secondary school|ged|baccalaureate|undergraduate|postgraduate|degree)\\b",
  "i",
);

export const INSTITUTION_RE = new RegExp(
  "\\b(?:university|college|institute|institution|school|academy|polytechnic|universit[àáéäöüy]\\w*|" +
    "universidad|universidade|hochschule|conservatory|seminary|iit|nit|mit|bits|" +
    "faculty|campus)\\b",
  "i",
);

export const LEVEL_RE = new RegExp(
  "\\b(?:native|mother\\s+tongue|bilingual|fluent|proficient|professional(?:\\s+working)?|" +
    "full\\s+professional|limited\\s+working|advanced|upper[- ]intermediate|intermediate|" +
    "conversational|elementary|beginner|basic|working|[abc][12])\\b",
  "i",
);

export const SOFT_SKILL_HINT_RE =
  /\b(?:soft|interpersonal|people|communication|leadership|teamwork|collaboration|management)\b/i;

export const COUNTRIES = new Set(
  [
    "usa", "u.s.a.", "united states", "uk", "united kingdom", "england", "scotland", "wales",
    "canada", "australia", "india", "germany", "france", "spain", "italy", "netherlands",
    "sweden", "norway", "finland", "denmark", "ireland", "portugal", "brazil", "mexico",
    "argentina", "chile", "colombia", "japan", "china", "south korea", "korea", "singapore",
    "malaysia", "indonesia", "thailand", "vietnam", "philippines", "pakistan", "bangladesh",
    "sri lanka", "nepal", "uae", "united arab emirates", "saudi arabia", "qatar", "egypt",
    "turkey", "greece", "poland", "austria", "switzerland", "belgium", "new zealand",
    "south africa", "nigeria", "kenya", "israel", "russia", "ukraine", "romania", "remote",
  ].map((c) => c.toLowerCase()),
);

/** Spoken languages, to tell a Languages section from a list of programming languages. */
export const HUMAN_LANGUAGES = new Set(
  [
    "english", "spanish", "french", "german", "italian", "portuguese", "dutch", "swedish",
    "norwegian", "danish", "finnish", "icelandic", "polish", "czech", "slovak", "hungarian",
    "romanian", "bulgarian", "greek", "turkish", "russian", "ukrainian", "belarusian", "serbian",
    "croatian", "bosnian", "slovenian", "albanian", "macedonian", "lithuanian", "latvian",
    "estonian", "irish", "welsh", "catalan", "basque", "galician", "arabic", "hebrew", "persian",
    "farsi", "urdu", "hindi", "bengali", "bangla", "punjabi", "gujarati", "marathi", "tamil",
    "telugu", "kannada", "malayalam", "odia", "sinhala", "nepali", "chinese", "mandarin",
    "cantonese", "japanese", "korean", "vietnamese", "thai", "lao", "khmer", "burmese",
    "malay", "indonesian", "bahasa", "filipino", "tagalog", "swahili", "amharic", "yoruba",
    "igbo", "hausa", "zulu", "xhosa", "afrikaans", "somali", "kurdish", "armenian", "georgian",
    "azerbaijani", "kazakh", "uzbek", "mongolian", "latin", "sign language", "asl", "bsl",
    "esperanto", "maltese", "luxembourgish", "pashto", "dari", "tigrinya", "haitian creole",
  ],
);
