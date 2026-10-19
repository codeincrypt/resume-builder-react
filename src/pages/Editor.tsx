import { useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DownOutlined,
  DownloadOutlined,
  EyeOutlined,
  FullscreenExitOutlined,
  PrinterOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Alert, App, Button, Dropdown, Input, Modal, Result, Segmented, Select, Space, Spin, Tabs } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import DesignPanel from "../components/editor/DesignPanel";
import OriginalFileNotice from "../components/editor/OriginalFileNotice";
import SectionsPanel from "../components/editor/SectionsPanel";
import PreviewPane from "../components/PreviewPane";
import TemplateGallery from "../components/TemplateGallery";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useResumeEditor } from "../hooks/useResumeEditor";
import type { SheetDoc } from "../resume/ResumeSheet";
import { TEMPLATES, getTemplate } from "../resume/registry";
import { useAppSelector } from "../store/hooks";
import type { ResumeDoc } from "../types/resume";
import { timeAgo } from "../utils/dates";
import { downloadResumePdf, printResume } from "../utils/pdf";

export default function Editor() {
  const { id = "" } = useParams();
  const uid = useAppSelector((state) => state.auth.user?.uid ?? "");
  // Remount per resume so one document's edit state can never leak into another.
  return <EditorInner key={id} uid={uid} id={id} />;
}

function SaveIndicator({
  status,
  savedAt,
  error,
  onRetry,
}: {
  status: "saved" | "dirty" | "saving" | "error";
  savedAt: string | null;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === "saving") {
    return (
      <span className="save-indicator" role="status">
        <SyncOutlined spin /> Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="save-indicator save-indicator--error" role="alert" title={error ?? undefined}>
        <WarningOutlined /> Not saved{" "}
        <Button size="small" type="link" onClick={onRetry}>
          Retry
        </Button>
      </span>
    );
  }
  if (status === "dirty") {
    return (
      <span className="save-indicator" role="status">
        Unsaved changes
      </span>
    );
  }
  return (
    <span className="save-indicator save-indicator--ok" role="status">
      <CheckCircleOutlined /> Saved{savedAt ? ` ${timeAgo(savedAt)}` : ""}
    </span>
  );
}

function EditorInner({ uid, id }: { uid: string; id: string }) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { doc, status, loadError, saveStatus, saveError, savedAt, edit, saveNow } =
    useResumeEditor(uid, id);

  useDocumentTitle(doc?.title ? `${doc.title} — Editor` : "Editor");

  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const sheetDoc: SheetDoc | null = useMemo(
    () =>
      doc && {
        templateId: doc.templateId,
        content: doc.content,
        design: doc.design,
        sections: doc.sections,
      },
    [doc],
  );

  if (status === "loading") {
    return (
      <div className="page-loading" role="status">
        <Spin size="large" />
        <span className="sr-only">Loading your resume…</span>
      </div>
    );
  }
  if (status === "notfound") {
    return (
      <Result
        status="404"
        title="Resume not found"
        subTitle="It may have been deleted, or it belongs to a different account."
        extra={<Button type="primary" onClick={() => navigate("/dashboard")}>Back to my resumes</Button>}
      />
    );
  }
  if (status === "error" || !doc || !sheetDoc) {
    return (
      <Result
        status="error"
        title="We couldn't open this resume"
        subTitle={loadError ?? "Check your connection and try again."}
        extra={<Button type="primary" onClick={() => window.location.reload()}>Try again</Button>}
      />
    );
  }

  const leave = async () => {
    await saveNow();
    navigate("/dashboard");
  };

  const download = async () => {
    setExporting(true);
    const hide = message.loading("Preparing your PDF…", 0);
    try {
      await downloadResumePdf(sheetDoc, doc.title);
      message.success("Your PDF has been downloaded.");
    } catch (error) {
      console.error(error);
      message.error("Couldn't create the PDF. Please try again.");
    } finally {
      hide();
      setExporting(false);
    }
  };

  const print = async () => {
    try {
      await printResume(sheetDoc, doc.title);
    } catch (error) {
      console.error(error);
      message.error("Couldn't open the print dialog.");
    }
  };

  const chooseTemplate = (templateId: string) => {
    edit((d) => {
      d.templateId = templateId;
      // A new template brings its own palette and type; the content is untouched.
      d.design.accent = null;
      d.design.fontKey = null;
      d.design.fontSize = null;
    });
    setTemplatesOpen(false);
    message.success(`Switched to ${getTemplate(templateId).name}.`);
  };

  const exportMenu = {
    items: [
      { key: "print", icon: <PrinterOutlined />, label: "Print…", onClick: print },
      { key: "full", icon: <EyeOutlined />, label: "Full-screen preview", onClick: () => setFullscreen(true) },
    ],
  };

  const editPanel = (
    <Tabs
      className="editor__tabs"
      items={[
        {
          key: "content",
          label: "Content",
          children: (
            <>
              {doc.originalFile && (
                <OriginalFileNotice
                  file={doc.originalFile}
                  onRemoved={() => edit((d) => void (d.originalFile = null))}
                />
              )}
              <SectionsPanel doc={doc} edit={(recipe) => edit(recipe as (d: ResumeDoc) => void)} />
            </>
          ),
        },
        {
          key: "design",
          label: "Design",
          children: (
            <DesignPanel
              templateId={doc.templateId}
              design={doc.design}
              onChange={(recipe) => edit((d) => recipe(d.design))}
              onChangeTemplate={() => setTemplatesOpen(true)}
            />
          ),
        },
      ]}
    />
  );

  return (
    <div className={`editor editor--${mobileTab}`}>
      <header className="editor__toolbar">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={leave}
          aria-label="Back to my resumes"
        />
        <Input
          className="editor__title"
          variant="borderless"
          value={doc.title}
          maxLength={120}
          aria-label="Resume name"
          onChange={(e) => edit((d) => void (d.title = e.target.value))}
          onBlur={() => {
            if (!doc.title.trim()) edit((d) => void (d.title = "Untitled resume"));
          }}
        />
        <SaveIndicator status={saveStatus} savedAt={savedAt} error={saveError} onRetry={saveNow} />
        <div className="editor__actions">
          <Button className="editor__template-btn" onClick={() => setTemplatesOpen(true)}>
            Template: {getTemplate(doc.templateId).name}
          </Button>
          <Space.Compact>
            <Button
              type="primary"
              className="dl-main"
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={download}
              aria-label="Download PDF"
            >
              <span className="btn-text">Download PDF</span>
            </Button>
            <Dropdown menu={exportMenu} placement="bottomRight" trigger={["click"]}>
              <Button type="primary" icon={<DownOutlined />} aria-label="More export options" />
            </Dropdown>
          </Space.Compact>
        </div>
      </header>

      <div className="editor__mobile-switch">
        <Segmented
          block
          value={mobileTab}
          onChange={(v) => setMobileTab(v as "edit" | "preview")}
          options={[
            { label: "Edit", value: "edit" },
            { label: "Preview", value: "preview" },
          ]}
        />
      </div>

      <div className="editor__body">
        <section className="editor__panel" aria-label="Edit resume">
          {saveStatus === "error" && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              title="Your latest changes aren't saved yet."
              description={saveError ?? "We'll keep trying. Your edits are still here."}
            />
          )}
          {editPanel}
        </section>
        <section className="editor__preview" aria-label="Preview">
          <PreviewPane
            doc={sheetDoc}
            extra={
              <Select
                size="small"
                style={{ width: 148 }}
                value={doc.templateId}
                aria-label="Switch template"
                showSearch
                optionFilterProp="label"
                onChange={chooseTemplate}
                options={TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
              />
            }
          />
          <Button
            className="editor__fs-btn"
            icon={<EyeOutlined />}
            onClick={() => setFullscreen(true)}
          >
            Full screen
          </Button>
        </section>
      </div>

      <Modal
        title="Choose a template"
        open={templatesOpen}
        onCancel={() => setTemplatesOpen(false)}
        footer={null}
        width="min(1180px, 96vw)"
        destroyOnHidden
      >
        <p className="muted">
          Your content stays exactly as it is — these previews show your resume in each design.
        </p>
        <TemplateGallery
          compact
          content={doc.content}
          design={doc.design}
          sections={doc.sections}
          selectedId={doc.templateId}
          onSelect={chooseTemplate}
          actionLabel="Switch to"
        />
      </Modal>

      <Modal
        open={fullscreen}
        onCancel={() => setFullscreen(false)}
        footer={null}
        closable={false}
        destroyOnHidden
        width="100vw"
        className="fullscreen-modal"
        styles={{ container: { padding: 0 }, body: { padding: 0 } }}
        title={null}
      >
        <div className="fullscreen">
          <div className="fullscreen__bar">
            <strong>{doc.title}</strong>
            <div className="fullscreen__actions">
              <Button icon={<PrinterOutlined />} onClick={print}>Print</Button>
              <Button type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={download}>
                Download PDF
              </Button>
              <Button icon={<FullscreenExitOutlined />} onClick={() => setFullscreen(false)}>
                Close
              </Button>
            </div>
          </div>
          <div className="fullscreen__body">
            <PreviewPane doc={sheetDoc} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
