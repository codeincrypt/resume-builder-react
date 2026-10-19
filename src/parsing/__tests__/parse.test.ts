import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findGutter, orderByColumns } from "../extract";
import { parseResumeText } from "../parseResume";
import { toYearMonth } from "../patterns";

const CLASSIC = `Jordan Rivera
Senior Software Engineer
jordan.rivera@example.com | (415) 555-0132 | Austin, TX
linkedin.com/in/jordanrivera | jordanrivera.dev

PROFESSIONAL SUMMARY
Engineer with ten years of experience building distributed systems.
Focused on reliability and developer experience.

WORK EXPERIENCE
Senior Software Engineer
Northwind Labs, Austin, TX
Mar 2020 - Present
• Led migration of the billing platform to Kubernetes, cutting costs by 30%
• Mentored six engineers

Software Engineer
Initech Inc.
June 2015 – February 2020
• Built the real-time notifications service handling 2M events per day, working
with product and design to ship it
• Reduced p99 latency from 900ms to 120ms

EDUCATION
B.S. Computer Science
University of Texas at Austin, Austin, TX
2011 - 2015
GPA: 3.8

SKILLS
Languages: Python, Go, TypeScript
Cloud: AWS (EC2, S3, Lambda), Terraform, Docker

SOFT SKILLS
Leadership, Communication, Mentoring

CERTIFICATIONS
AWS Certified Solutions Architect – Amazon Web Services, 2021
CKA - Cloud Native Computing Foundation (2022)

LANGUAGES
English (Native), Spanish - Professional

AWARDS
Engineering Excellence Award, Northwind Labs, 2022
`;

describe("toYearMonth", () => {
  it("normalises common date shapes", () => {
    assert.equal(toYearMonth("Mar 2020"), "2020-03");
    assert.equal(toYearMonth("September 2019"), "2019-09");
    assert.equal(toYearMonth("03/2020"), "2020-03");
    assert.equal(toYearMonth("2020-03"), "2020-03");
    assert.equal(toYearMonth("2018"), "2018");
    // A season is not a month; no month is invented.
    assert.equal(toYearMonth("Summer 2020"), "2020");
  });
});

describe("parseResumeText — classic layout", () => {
  const { content, issues } = parseResumeText(CLASSIC);

  it("reads contact details", () => {
    assert.equal(content.personal.fullName, "Jordan Rivera");
    assert.equal(content.personal.jobTitle, "Senior Software Engineer");
    assert.equal(content.personal.email, "jordan.rivera@example.com");
    assert.equal(content.personal.phone, "(415) 555-0132");
    assert.equal(content.personal.location, "Austin, TX");
    assert.match(content.personal.linkedin, /linkedin\.com\/in\/jordanrivera/);
    assert.equal(content.personal.website, "jordanrivera.dev");
  });

  it("keeps the summary wording, joining wrapped lines", () => {
    assert.equal(
      content.summary,
      "Engineer with ten years of experience building distributed systems. Focused on reliability and developer experience.",
    );
  });

  it("splits experience into entries with title, company, place and dates", () => {
    assert.equal(content.experience.length, 2);
    const [a, b] = content.experience;
    assert.equal(a.position, "Senior Software Engineer");
    assert.equal(a.company, "Northwind Labs");
    assert.equal(a.location, "Austin, TX");
    assert.equal(a.startDate, "2020-03");
    assert.equal(a.current, true);
    assert.equal(a.endDate, "");
    assert.equal(a.bullets.length, 2);
    assert.equal(b.position, "Software Engineer");
    assert.equal(b.company, "Initech Inc.");
    assert.equal(b.startDate, "2015-06");
    assert.equal(b.endDate, "2020-02");
    assert.equal(b.current, false);
    assert.equal(b.bullets.length, 2);
    // Wrapped bullet is one bullet, original wording preserved.
    assert.equal(
      b.bullets[0],
      "Built the real-time notifications service handling 2M events per day, working with product and design to ship it",
    );
  });

  it("reads education", () => {
    assert.equal(content.education.length, 1);
    const [e] = content.education;
    assert.equal(e.degree, "B.S. Computer Science");
    assert.equal(e.institution, "University of Texas at Austin");
    assert.equal(e.location, "Austin, TX");
    assert.equal(e.startDate, "2011");
    assert.equal(e.endDate, "2015");
    assert.deepEqual(e.bullets, ["GPA: 3.8"]);
  });

  it("groups skills by label, keeping soft skills apart", () => {
    const byName = Object.fromEntries(content.skills.map((g) => [g.name, g.items]));
    assert.deepEqual(byName["Languages"], ["Python", "Go", "TypeScript"]);
    assert.deepEqual(byName["Cloud"], ["AWS (EC2, S3, Lambda)", "Terraform", "Docker"]);
    assert.deepEqual(byName["Soft skills"], ["Leadership", "Communication", "Mentoring"]);
  });

  it("reads certifications, languages and awards", () => {
    assert.equal(content.certifications.length, 2);
    assert.equal(content.certifications[0].name, "AWS Certified Solutions Architect");
    assert.equal(content.certifications[0].issuer, "Amazon Web Services");
    assert.equal(content.certifications[0].date, "2021");
    assert.equal(content.certifications[1].name, "CKA");
    assert.equal(content.certifications[1].issuer, "Cloud Native Computing Foundation");

    assert.deepEqual(
      content.languages.map((l) => [l.name, l.level]),
      [["English", "Native"], ["Spanish", "Professional"]],
    );
    assert.equal(content.awards[0].title, "Engineering Excellence Award");
    assert.equal(content.awards[0].date, "2022");
  });

  it("raises no spurious issues for a complete resume", () => {
    const real = issues.filter((i) => i.level === "uncertain" || i.path.startsWith("experience"));
    assert.deepEqual(real, []);
  });
});

describe("parseResumeText — other layouts", () => {
  it("handles one-line headers and a date-first layout", () => {
    const text = `Priya Nair
priya@example.com

Experience
Product Manager | Acme Corp | Bengaluru, India | Jan 2021 - Present
- Owned the roadmap for the payments product
- Grew revenue 40% year over year

Jun 2018 - Dec 2020
Business Analyst at Globex Ltd
- Wrote requirements for the CRM rollout

Education
Master of Business Administration, Indian Institute of Management, 2018
`;
    const { content } = parseResumeText(text);
    assert.equal(content.experience.length, 2);
    const [a, b] = content.experience;
    assert.equal(a.position, "Product Manager");
    assert.equal(a.company, "Acme Corp");
    assert.equal(a.location, "Bengaluru, India");
    assert.equal(a.startDate, "2021-01");
    assert.equal(a.current, true);
    assert.deepEqual(a.bullets, [
      "Owned the roadmap for the payments product",
      "Grew revenue 40% year over year",
    ]);
    assert.equal(b.position, "Business Analyst");
    assert.equal(b.company, "Globex Ltd");
    assert.equal(b.startDate, "2018-06");
    assert.equal(b.endDate, "2020-12");

    assert.equal(content.education.length, 1);
    assert.match(content.education[0].degree, /Master of Business Administration/);
    assert.match(content.education[0].institution, /Indian Institute of Management/);
    assert.equal(content.education[0].endDate, "2018");
  });

  it("flags what it could not find instead of inventing it", () => {
    const { content, issues } = parseResumeText("Sam Lee\nsam@example.com\n\nSkills\nJavaScript, React\n");
    assert.equal(content.personal.fullName, "Sam Lee");
    assert.equal(content.personal.phone, "");
    assert.equal(content.experience.length, 0);
    const paths = issues.map((i) => i.path);
    assert.ok(paths.includes("personal.phone"));
    assert.ok(paths.includes("section.experience"));
    assert.ok(paths.includes("section.education"));
    assert.deepEqual(content.skills[0].items, ["JavaScript", "React"]);
  });

  it("keeps unrecognised sections as their own named section", () => {
    const { content } = parseResumeText(
      "Alex Kim\nalex@example.com\n\nINTERESTS\nRock climbing\nChess\n",
    );
    assert.equal(content.custom.length, 1);
    assert.equal(content.custom[0].title, "Interests");
    assert.deepEqual(content.custom[0].entries.map((e) => e.heading), ["Rock climbing", "Chess"]);
  });

  it("parses projects with links and technologies", () => {
    const { content } = parseResumeText(
      `Dana Fox
dana@example.com

Projects
Budget Tracker | React, Node.js | github.com/dana/budget
- Tracks spending across accounts

Weather CLI
Technologies: Rust, Clap
- Command-line forecasts
`,
    );
    assert.equal(content.projects.length, 2);
    assert.equal(content.projects[0].name, "Budget Tracker");
    assert.deepEqual(content.projects[0].technologies, ["React", "Node.js"]);
    assert.match(content.projects[0].link, /github\.com\/dana\/budget/);
    assert.deepEqual(content.projects[0].bullets, ["Tracks spending across accounts"]);
    assert.deepEqual(content.projects[1].technologies, ["Rust", "Clap"]);
  });
});

describe("parseResumeText — designer and two-column layouts", () => {
  it("reads letter-spaced headings and stacked skill groups", () => {
    const { content } = parseResumeText(`Ana Silva
Data Engineer
ana@example.com | +351 912 345 678 | Lisbon, Portugal

W O R K  E X P E R I E N C E

Data Engineer
Feedzai · Lisbon, Portugal
Jan 2021 – Present
• Built streaming pipelines for fraud detection

S K I L L S

Languages
Python
Scala
SQL

Soft skills
Leadership
Communication

I N T E R E S T S

Surfing
`);
    assert.equal(content.experience.length, 1);
    assert.equal(content.experience[0].company, "Feedzai");
    assert.equal(content.experience[0].location, "Lisbon, Portugal");
    const byName = Object.fromEntries(content.skills.map((g) => [g.name, g.items]));
    // "Languages" here labels programming languages, and "Leadership" is a
    // skill — neither starts a new section.
    assert.deepEqual(byName["Languages"], ["Python", "Scala", "SQL"]);
    assert.deepEqual(byName["Soft skills"], ["Leadership", "Communication"]);
    assert.equal(content.volunteer.length, 0);
    assert.equal(content.languages.length, 0);
    assert.equal(content.custom[0].title, "Interests");
  });

  it("treats a Languages section of programming languages as skills", () => {
    const { content } = parseResumeText(`Lee Park
lee@example.com

Skills
Docker, Kubernetes

Languages
Python, Go, Rust
`);
    assert.equal(content.languages.length, 0);
    assert.deepEqual(
      content.skills.find((g) => g.name === "Languages")?.items,
      ["Python", "Go", "Rust"],
    );
  });

  it("joins a certification wrapped over several lines", () => {
    const { content } = parseResumeText(`Sam Ortiz
sam@example.com

CERTIFICATIONS
AWS Certified Solutions
Architect
Amazon Web Services
2021

PMP – Project Management Institute, 2019
`);
    assert.deepEqual(
      content.certifications.map((c) => [c.name, c.issuer, c.date]),
      [
        ["AWS Certified Solutions Architect", "Amazon Web Services", "2021"],
        ["PMP", "Project Management Institute", "2019"],
      ],
    );
  });

  it("keeps details separated by a gap with their education entry", () => {
    const { content } = parseResumeText(`Kim Ito
kim@example.com

EDUCATION
B.S. Computer Science
University of Washington · Seattle, WA
2014 – 2018

GPA: 3.9
`);
    assert.equal(content.education.length, 1);
    assert.equal(content.education[0].institution, "University of Washington");
    assert.equal(content.education[0].location, "Seattle, WA");
    assert.deepEqual(content.education[0].bullets, ["GPA: 3.9"]);
  });

  it("reads contact details from a Contact block", () => {
    const { content } = parseResumeText(`CONTACT
+44 20 7946 0958
lena@example.com
London, UK

Lena Hart
Brand Designer

EXPERIENCE
Brand Designer | Pentagram | 2019 – Present
• Identity systems for cultural clients
`);
    assert.equal(content.personal.phone, "+44 20 7946 0958");
    assert.equal(content.personal.email, "lena@example.com");
    assert.equal(content.personal.location, "London, UK");
    assert.equal(content.custom.length, 0);
  });
});

describe("PDF line ordering", () => {
  const line = (text: string, x0: number, x1: number, y: number, height = 10) => ({
    text, x0, x1, y, height, breakBefore: false,
  });

  it("reads a two-column page column by column, across pages", () => {
    // Main column on the left (with the large name), skills rail on the right;
    // the main column continues onto page 2.
    const page1 = [
      line("Jordan Rivera", 36, 200, 800, 24),
      line("EXPERIENCE", 36, 120, 760),
      ...Array.from({ length: 8 }, (_, i) => line(`Main line ${i}`, 36, 380, 740 - i * 14)),
      line("SKILLS", 430, 500, 760),
      ...Array.from({ length: 6 }, (_, i) => line(`Skill ${i}`, 430, 540, 740 - i * 14)),
    ];
    const page2 = Array.from({ length: 4 }, (_, i) => line(`Main p2 ${i}`, 36, 380, 800 - i * 14));
    const pages = [
      { lines: page1, width: 595 },
      { lines: page2, width: 595 },
    ];
    const gutter = findGutter(pages);
    assert.ok(gutter && gutter > 380 && gutter < 430, `gutter ${gutter}`);
    const text = orderByColumns(pages, gutter!).filter(Boolean);
    assert.ok(text.indexOf("Main p2 0") < text.indexOf("SKILLS"), "page 2 main text precedes the rail");
    assert.equal(text[0], "Jordan Rivera");
  });

  it("keeps a right-aligned date with its entry in a two-column layout", () => {
    // Stream order is title, company, then the date drawn back up on the
    // title's baseline — the way an HTML/CSS layout exports.
    const main = [
      line("Jordan Rivera", 36, 200, 800, 24),
      line("WORK EXPERIENCE", 36, 160, 760),
      line("Staff Engineer", 36, 140, 740),
      line("Northwind Labs · Austin, TX", 36, 200, 726),
      line("Mar 2020 – Present", 300, 380, 740),
      line("• Led the billing platform migration", 36, 380, 710),
      line("• Mentored six engineers", 36, 300, 696),
      line("Engineer", 36, 110, 670),
      line("Initech Inc.", 36, 120, 656),
      line("Jan 2017 – Feb 2020", 300, 380, 670),
      line("• Built the notifications service", 36, 380, 640),
      ...Array.from({ length: 4 }, (_, i) => line(`• Filler bullet ${i}`, 36, 380, 620 - i * 14)),
    ];
    const rail = [
      line("SKILLS", 430, 500, 760),
      ...Array.from({ length: 6 }, (_, i) => line(`Skill ${i}`, 430, 540, 740 - i * 14)),
    ];
    const pages = [{ lines: [...main, ...rail], width: 595 }];
    const gutter = findGutter(pages);
    assert.ok(gutter);
    const { content } = parseResumeText(orderByColumns(pages, gutter!).join("\n"));
    assert.deepEqual(
      content.experience.map((e) => [e.position, e.company, e.location, e.startDate, e.bullets.length]),
      [
        ["Staff Engineer", "Northwind Labs", "Austin, TX", "2020-03", 2],
        ["Engineer", "Initech Inc.", "", "2017-01", 5],
      ],
    );
  });

  it("finds no gutter in a single-column page", () => {
    const lines = Array.from({ length: 20 }, (_, i) =>
      line(i % 3 ? `A long bullet line that spans most of the page ${i}` : `Short ${i}`, 36, i % 3 ? 540 : 120, 800 - i * 14),
    );
    assert.equal(findGutter([{ lines, width: 595 }]), null);
  });
});
