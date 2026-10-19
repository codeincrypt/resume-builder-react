import { CheckCircleFilled } from "@ant-design/icons";
import { Button, Collapse } from "antd";
import { Link, useNavigate } from "react-router-dom";

import TemplateThumb from "../components/TemplateThumb";
import { CATEGORIES, CATEGORY_LABELS, TEMPLATES } from "../resume/registry";
import { SAMPLE_CONTENT } from "../resume/sampleData";
import { useAppSelector } from "../store/hooks";
import { DEFAULT_DESIGN, defaultSections } from "../types/resume";

const sections = defaultSections();
const doc = (templateId: string) => ({
  templateId,
  content: SAMPLE_CONTENT,
  design: DEFAULT_DESIGN,
  sections,
});

const FEATURED = ["london", "tokyo", "paris", "seoul", "vienna", "abu-dhabi"];
const HERO = ["new-delhi", "paris", "tokyo"];

const STEPS = [
  ["Sign in", "Use Google, or an email and password. Your resumes stay private to your account."],
  ["Create or upload", "Start from scratch, or upload a PDF, DOCX or TXT and let us organise it."],
  ["Pick a capital", "Choose from 25 designs. Switch any time — your words never move."],
  ["Customise & download", "Tune fonts, colours and spacing with a live preview, then download a crisp PDF."],
];

const FEATURES = [
  ["Live, multi-page preview", "See exactly where each page ends, with zoom, a full-screen view and page count."],
  ["Fonts, colours and spacing", "Fourteen typefaces, any accent colour, spacing, margins and A4 or US Letter."],
  ["Reorder and hide sections", "Move sections up or down, hide what you don't need, add your own, and set page breaks."],
  ["ATS-friendly mode", "One switch turns any template into a plain single-column layout for applicant-tracking systems."],
  ["PDF with real text", "Downloaded PDFs keep selectable, searchable text — and match the preview."],
  ["Private by design", "Uploads are read in your browser. No AI, no training on your resume, and you can delete everything."],
];

const FAQ = [
  [
    "How does the upload work without AI?",
    "We extract the text from your PDF, DOCX or TXT (and use OCR for scanned PDFs), then match it against section headings, dates, contact formats and common job-title and degree words. It's rule-based, so it never rewrites or invents anything — anything it isn't sure about is highlighted for you to check.",
  ],
  [
    "Which file types can I upload?",
    "PDF, DOCX and TXT, up to 10 MB. Older .doc files should be saved as .docx or PDF first.",
  ],
  [
    "Will I see what you extracted before it's used?",
    "Yes. Every upload goes to a review screen where each field is editable, and missing or uncertain items are flagged, before you choose a template.",
  ],
  [
    "Can I change templates later?",
    "Whenever you like. Content and design are stored separately, so switching to another capital never erases anything.",
  ],
  [
    "Is my resume private? Can I delete it?",
    "Only you can read your resumes and files. You can delete a resume, or your whole account with everything in it, whenever you want. See the privacy policy for the details.",
  ],
  [
    "Does it work on my phone?",
    "Yes. On small screens the editor switches between Edit and Preview so each gets the whole screen.",
  ],
  [
    "Are the PDFs ATS-friendly?",
    "Text in the PDF is selectable and searchable. For the strictest parsers, use an ATS-Friendly template or turn on ATS-friendly mode in the Design tab.",
  ],
];

export default function Home() {
  const navigate = useNavigate();
  const signedIn = useAppSelector((state) => !!state.auth.user?.emailVerified);

  // Signed-out visitors sign up first, then land where they were headed.
  const go = (target: string) =>
    signedIn ? navigate(target) : navigate("/signup", { state: { from: target } });

  return (
    <div className="landing">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">Resume builder</p>
            <h1 className="hero__title">Your Experience. Your Story. Your Next Opportunity.</h1>
            <p className="hero__lead">
              Build a professional resume in minutes. Upload your old resume, automatically organize
              your information, choose from 25+ beautifully designed templates, and download your
              next career move.
            </p>
            <div className="hero__cta">
              <Button type="primary" size="large" onClick={() => go("/create")}>
                Build My Resume
              </Button>
              <Button size="large" onClick={() => go("/upload")}>
                Upload Existing Resume
              </Button>
            </div>
            <ul className="hero__points">
              <li><CheckCircleFilled /> 25 capital-city templates</li>
              <li><CheckCircleFilled /> No AI writing, no AI training</li>
              <li><CheckCircleFilled /> PDF with selectable text</li>
            </ul>
          </div>
          <div className="hero__visual" aria-hidden="true">
            {HERO.map((id, i) => (
              <div key={id} className={`hero__sheet hero__sheet--${i}`}>
                <TemplateThumb doc={doc(id)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band" id="how-it-works" aria-labelledby="how-title">
        <div className="container">
          <h2 id="how-title" className="band__title">How it works</h2>
          <ol className="steps">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <span className="steps__n">{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band band--tint" aria-labelledby="featured-title">
        <div className="container">
          <div className="band__head">
            <div>
              <h2 id="featured-title" className="band__title">Featured capital-city templates</h2>
              <p className="muted">Each one has its own layout, typography and palette.</p>
            </div>
            <Button onClick={() => navigate("/templates")}>Browse all {TEMPLATES.length}</Button>
          </div>
          <ul className="featured">
            {FEATURED.map((id) => {
              const spec = TEMPLATES.find((t) => t.id === id)!;
              return (
                <li key={id}>
                  <Link to="/templates" className="featured__card">
                    <TemplateThumb doc={doc(id)} />
                    <strong>{spec.name}</strong>
                    <span className="featured__tagline">{spec.tagline}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="band" id="upload" aria-labelledby="upload-title">
        <div className="container split">
          <div>
            <h2 id="upload-title" className="band__title">Upload and prefill</h2>
            <p className="lead">
              Already have a resume? Drop in a PDF, DOCX or TXT and we'll pull out your name,
              contact details, experience, education, skills and more — then show you everything to
              check before it goes anywhere.
            </p>
            <ul className="ticks">
              <li><CheckCircleFilled /> Your wording is kept as written</li>
              <li><CheckCircleFilled /> Missing or uncertain fields are highlighted, never invented</li>
              <li><CheckCircleFilled /> Scanned PDFs are read with OCR, in your browser</li>
              <li><CheckCircleFilled /> Rule-based parsing — no AI model involved</li>
            </ul>
            <Button type="primary" size="large" onClick={() => go("/upload")}>
              Upload Existing Resume
            </Button>
          </div>
          <div className="parse-card" aria-hidden="true">
            <div className="parse-card__file">resume.pdf</div>
            <dl>
              <dt>Name</dt><dd>Found</dd>
              <dt>Contact</dt><dd>Found</dd>
              <dt>Experience</dt><dd>Entries with dates</dd>
              <dt>Education</dt><dd>Found</dd>
              <dt className="warn">Phone</dt><dd className="warn">Not found — add it</dd>
            </dl>
            <p>An example of the review screen's checks.</p>
          </div>
        </div>
      </section>

      <section className="band band--tint" id="features" aria-labelledby="features-title">
        <div className="container">
          <h2 id="features-title" className="band__title">Everything you need to customise</h2>
          <ul className="features">
            {FEATURES.map(([title, body]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band" aria-labelledby="cats-title">
        <div className="container">
          <h2 id="cats-title" className="band__title">Template categories</h2>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <Link key={c} className="chip" to={`/templates?category=${c}`}>
                {CATEGORY_LABELS[c]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="band band--tint" aria-labelledby="faq-title">
        <div className="container container--narrow">
          <h2 id="faq-title" className="band__title">Frequently asked questions</h2>
          <Collapse
            ghost
            items={FAQ.map(([q, a], i) => ({
              key: String(i),
              label: <strong>{q}</strong>,
              children: <p>{a}</p>,
            }))}
          />
        </div>
      </section>

      <section className="cta">
        <div className="container cta__inner">
          <h2>Ready for your next opportunity?</h2>
          <p>Build the resume. Download it. Send it.</p>
          <Button type="primary" size="large" onClick={() => go("/create")}>
            Build My Resume
          </Button>
        </div>
      </section>
    </div>
  );
}
