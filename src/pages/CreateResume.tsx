import { useState } from "react";
import { ArrowLeftOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Input } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import TemplateGallery from "../components/TemplateGallery";
import { DEFAULT_TEMPLATE_ID, getTemplate, isTemplateId } from "../resume/registry";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createResume } from "../store/slices/resumeSlice";
import { emptyContent } from "../types/resume";

/** `/create` — choose a template, name the resume, open the editor. */
export default function CreateResume() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useAppSelector((state) => state.auth.user);
  const [params] = useSearchParams();

  const requested = params.get("template");
  const [templateId, setTemplateId] = useState(
    isTemplateId(requested) ? requested : DEFAULT_TEMPLATE_ID,
  );
  const [title, setTitle] = useState("My resume");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // Start with what the account already knows; nothing else is guessed.
      const content = emptyContent();
      content.personal.fullName = user.displayName;
      content.personal.email = user.email;

      const created = await dispatch(
        createResume({ uid: user.uid, resume: { title: title.trim() || "My resume", templateId, content } }),
      ).unwrap();
      navigate(`/editor/${created.id}`);
    } catch (error) {
      message.error((error as Error).message || "Couldn't create the resume. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="create">
      <Link to="/dashboard" className="back-link">
        <ArrowLeftOutlined /> My resumes
      </Link>
      <h1 className="page-title">Create a new resume</h1>
      <p className="muted">
        Pick a design — you can change it any time and your content will carry over.{" "}
        <Link to="/upload">
          <UploadOutlined /> Or upload an existing resume
        </Link>
      </p>

      <TemplateGallery
        selectedId={templateId}
        onSelect={setTemplateId}
        actionLabel="Choose"
      />

      <div className="create__bar" role="region" aria-label="Create resume">
        <div className="create__bar-inner">
          <div className="create__bar-field">
            <label htmlFor="resume-name">Resume name</label>
            <Input
              id="resume-name"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              onPressEnter={create}
            />
          </div>
          <div className="create__bar-template">
            Template: <strong>{getTemplate(templateId).name}</strong>
          </div>
          <Button type="primary" size="large" loading={busy} onClick={create}>
            Create resume
          </Button>
        </div>
      </div>
    </div>
  );
}
