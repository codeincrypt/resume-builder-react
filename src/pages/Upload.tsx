import { useMemo, useRef, useState } from "react";
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  InboxOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { createNextState } from "@reduxjs/toolkit";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Collapse,
  Input,
  Progress,
  Space,
  Steps,
  Tag,
  Upload as AntUpload,
} from "antd";
import { Link, useNavigate } from "react-router-dom";

import SectionsPanel from "../components/editor/SectionsPanel";
import type { EditableDoc } from "../components/editor/SectionsPanel";
import TemplateGallery from "../components/TemplateGallery";
import { isStorageConfigured } from "../database/firebase";
import { deleteOriginal, uploadOriginal } from "../database/storage";
import { extractText } from "../parsing/extract";
import type { Extracted, ExtractProgress } from "../parsing/extract";
import { ACCEPT_ATTR, MAX_FILE_BYTES, validateFile } from "../parsing/files";
import { parseResumeText } from "../parsing/parseResume";
import type { ParseIssue } from "../parsing/parseResume";
import { DEFAULT_TEMPLATE_ID, getTemplate } from "../resume/registry";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createResume } from "../store/slices/resumeSlice";
import { newId, normalizeSections } from "../types/resume";
import { sanitizeContent } from "../utils/sanitize";

type Phase = "choose" | "processing" | "review" | "template";

const SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  experience: "Work experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  languages: "Languages",
  awards: "Awards",
  volunteer: "Volunteer",
  custom: "Other sections",
};

export default function Upload() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useAppSelector((state) => state.auth.user);

  const [phase, setPhase] = useState<Phase>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ExtractProgress>({ stage: "reading", fraction: 0, message: "" });
  const [error, setError] = useState<string | null>(null);

  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [issues, setIssues] = useState<ParseIssue[]>([]);
  const [draft, setDraft] = useState<EditableDoc | null>(null);

  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [title, setTitle] = useState("");
  const [keepOriginal, setKeepOriginal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  // A cancelled or superseded run must not write results into the page.
  const run = useRef(0);

  const issueMap = useMemo(
    () => Object.fromEntries(issues.map((i) => [i.path, i])),
    [issues],
  );
  const flagged = issues.filter((i) => !i.path.startsWith("section."));
  const missing = issues.filter((i) => i.level === "missing").length;

  const reset = () => {
    run.current += 1;
    setPhase("choose");
    setFile(null);
    setError(null);
    setExtracted(null);
    setDraft(null);
    setIssues([]);
  };

  const handleFile = async (picked: File) => {
    const myRun = ++run.current;
    setError(null);
    setFile(picked);

    const check = await validateFile(picked);
    if (!check.ok) {
      setError(check.message);
      setFile(null);
      return;
    }

    setPhase("processing");
    setProgress({ stage: "reading", fraction: 0.02, message: "Starting…" });
    try {
      const result = await extractText(picked, check.kind, (p) => {
        if (run.current === myRun) setProgress(p);
      });
      if (run.current !== myRun) return;

      if (result.text.replace(/\s/g, "").length < 30) {
        throw new Error(
          "We couldn't find any readable text in that file. If it's a scan or an image, try a clearer copy or a text-based PDF.",
        );
      }

      const parsed = parseResumeText(result.text);
      const content = sanitizeContent(parsed.content);
      setExtracted(result);
      setIssues(parsed.issues);
      setDraft({ content, sections: normalizeSections(null, content.custom) });
      setTitle(
        content.personal.fullName ? `${content.personal.fullName} — Resume` : picked.name.replace(/\.[^.]+$/, ""),
      );
      setPhase("review");
    } catch (e) {
      if (run.current !== myRun) return;
      console.error(e);
      setError(e instanceof Error ? e.message : "Something went wrong reading that file.");
      setPhase("choose");
      setFile(null);
    }
  };

  const edit = (recipe: (d: EditableDoc) => void) =>
    setDraft((current) => (current ? createNextState(current, recipe) : current));

  const create = async () => {
    if (!user || !draft) return;
    setCreating(true);
    const id = newId();
    let original = null;
    try {
      if (keepOriginal && file && isStorageConfigured) {
        try {
          original = await uploadOriginal(user.uid, id, file, setUploadPct);
        } catch (e) {
          console.error(e);
          message.warning("We couldn't keep a copy of the original file, but your resume will still be created.");
        }
      }
      const created = await dispatch(
        createResume({
          uid: user.uid,
          resume: {
            id,
            title: title.trim() || "Imported resume",
            templateId,
            content: draft.content,
            sections: draft.sections,
            source: "upload",
            originalFile: original,
          },
        }),
      ).unwrap();
      navigate(`/editor/${created.id}`);
    } catch (e) {
      // Don't leave an orphaned upload behind a resume that was never created.
      if (original) void deleteOriginal(original.path).catch(() => undefined);
      message.error((e as Error).message || "Couldn't create the resume. Please try again.");
      setCreating(false);
      setUploadPct(null);
    }
  };

  const stepIndex = phase === "review" ? 1 : phase === "template" ? 2 : 0;
  const counts = draft
    ? [
        ["experience", draft.content.experience.length],
        ["education", draft.content.education.length],
        ["skills", draft.content.skills.reduce((n, g) => n + g.items.length, 0)],
        ["projects", draft.content.projects.length],
        ["certifications", draft.content.certifications.length],
        ["languages", draft.content.languages.length],
        ["awards", draft.content.awards.length],
        ["volunteer", draft.content.volunteer.length],
        ["custom", draft.content.custom.length],
      ].filter(([, n]) => (n as number) > 0)
    : [];

  return (
    <div className="upload">
      <Link to="/dashboard" className="back-link">
        <ArrowLeftOutlined /> My resumes
      </Link>
      <h1 className="page-title">Upload an existing resume</h1>
      <Steps
        current={stepIndex}
        className="upload__steps"
        items={[{ title: "Upload" }, { title: "Review" }, { title: "Choose template" }]}
      />

      {phase === "choose" && (
        <section aria-label="Upload a file">
          {error && (
            <Alert
              type="error"
              showIcon
              title="That didn't work"
              description={error}
              role="alert"
              style={{ marginBottom: 16 }}
            />
          )}
          <AntUpload.Dragger
            accept={ACCEPT_ATTR}
            multiple={false}
            showUploadList={false}
            beforeUpload={(picked) => {
              void handleFile(picked);
              return false;
            }}
            className="upload__drop"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Drop your resume here, or click to choose a file</p>
            <p className="ant-upload-hint">
              PDF, DOCX or TXT · up to {MAX_FILE_BYTES / 1024 / 1024} MB · scanned PDFs are read with OCR
            </p>
          </AntUpload.Dragger>
          <p className="upload__privacy">
            <LockOutlined /> Your file is read in your browser — it isn't uploaded anywhere unless
            you choose to keep a copy. No AI is involved. See our <Link to="/privacy">privacy policy</Link>.
          </p>
        </section>
      )}

      {phase === "processing" && (
        <section className="upload__processing" aria-live="polite">
          <FileTextOutlined className="upload__file-icon" />
          <strong>{file?.name}</strong>
          <Progress
            percent={Math.round(progress.fraction * 100)}
            status="active"
            aria-label="Reading your file"
          />
          <p className="muted">
            {progress.message || "Reading your file…"}
            {progress.stage === "ocr" && " Scanned documents take a little longer."}
          </p>
          <Button onClick={reset}>Cancel</Button>
        </section>
      )}

      {phase === "review" && draft && extracted && (
        <section aria-label="Review extracted information">
          <Alert
            type={flagged.length ? "warning" : "success"}
            showIcon
            title={
              flagged.length
                ? `We found your details — ${flagged.length} ${flagged.length === 1 ? "item needs" : "items need"} a look`
                : "We found your details"
            }
            description={
              <>
                <p style={{ marginBottom: 8 }}>
                  Check everything below and correct anything we got wrong. Fields marked in
                  orange were guessed or couldn't be found
                  {missing ? ` (${missing} not found)` : ""} — nothing was invented, and
                  anything we couldn't find is left blank.
                </p>
                <Space size={[4, 6]} wrap>
                  {counts.map(([key, n]) => (
                    <Tag key={key as string} color="blue">
                      {SECTION_LABELS[key as string]}: {n as number}
                    </Tag>
                  ))}
                  <Tag>Read {extracted.pages} {extracted.pages === 1 ? "page" : "pages"} · {extracted.method.toUpperCase()}</Tag>
                </Space>
                {extracted.warnings.map((w) => (
                  <p key={w} style={{ margin: "8px 0 0" }}>⚠ {w}</p>
                ))}
              </>
            }
            style={{ marginBottom: 16 }}
          />

          <SectionsPanel
            doc={draft}
            edit={edit}
            issues={issueMap}
            defaultOpen={[
              ...(issues.some((i) => i.path.startsWith("personal.")) ? ["personal"] : []),
              ...draft.sections
                .filter((s) =>
                  issues.some(
                    (i) =>
                      i.path === s.id ||
                      i.path === `section.${s.id}` ||
                      i.path.startsWith(`${s.id}.`) ||
                      i.path === `custom.${s.id}`,
                  ),
                )
                .map((s) => s.id),
            ]}
          />

          <Collapse
            className="upload__raw"
            ghost
            items={[
              {
                key: "raw",
                label: "View the text we extracted",
                children: (
                  <Input.TextArea
                    readOnly
                    value={extracted.text}
                    autoSize={{ minRows: 8, maxRows: 18 }}
                    aria-label="Extracted text"
                  />
                ),
              },
            ]}
          />

          <div className="upload__actions">
            <Button onClick={reset}>Upload a different file</Button>
            <Button type="primary" size="large" onClick={() => setPhase("template")}>
              Looks good — choose a template
            </Button>
          </div>
        </section>
      )}

      {phase === "template" && draft && (
        <section aria-label="Choose a template">
          <p className="muted">
            Here's your resume in each design. Pick one — you can switch later and nothing will be lost.
          </p>
          <TemplateGallery
            content={draft.content}
            sections={draft.sections}
            selectedId={templateId}
            onSelect={setTemplateId}
            actionLabel="Choose"
          />
          <div className="create__bar" role="region" aria-label="Create resume">
            <div className="create__bar-inner create__bar-inner--wrap">
              <div className="create__bar-field">
                <label htmlFor="upload-name">Resume name</label>
                <Input id="upload-name" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
              </div>
              {isStorageConfigured && (
                <Checkbox checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)}>
                  Keep a copy of my original file
                </Checkbox>
              )}
              <Space>
                <Button onClick={() => setPhase("review")} disabled={creating}>
                  Back
                </Button>
                <Button type="primary" size="large" loading={creating} onClick={create}>
                  {creating && uploadPct !== null ? `Uploading ${uploadPct}%` : `Create with ${getTemplate(templateId).name}`}
                </Button>
              </Space>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
