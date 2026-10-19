import { useEffect } from "react";
import { FileAddOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, App, Button, Skeleton } from "antd";
import { useNavigate } from "react-router-dom";

import ResumeCard from "../components/ResumeCard";
import TemplateGallery from "../components/TemplateGallery";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadResumes } from "../store/slices/resumeSlice";
import MyResume from "./MyResume";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useAppSelector((state) => state.auth.user);
  const { items, status, error } = useAppSelector((state) => state.resumes);
  const uid = user?.uid;

  useEffect(() => {
    if (uid) void dispatch(loadResumes(uid));
  }, [dispatch, uid]);

  const firstName = (user?.displayName || user?.email || "").split(/[\s@]/)[0];
  const loading = status === "loading" && items.length === 0;
  const empty = status === "ready" && items.length === 0;

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        <div>
          <h1>Welcome back{firstName ? `, ${firstName}` : ""}</h1>
          <p className="muted">Pick up where you left off, or start something new.</p>
        </div>
        <div className="dashboard__cta">
          <Button type="primary" size="large" icon={<FileAddOutlined />} onClick={() => navigate("/create")}>
            Create resume
          </Button>
          <Button size="large" icon={<UploadOutlined />} onClick={() => navigate("/upload")}>
            Upload existing resume
          </Button>
        </div>
      </section>

      {status === "error" && (
        <Alert
          type="error"
          showIcon
          title="We couldn't load your resumes."
          description={error}
          action={
            <Button size="small" onClick={() => uid && dispatch(loadResumes(uid))}>
              Try again
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {loading && <Skeleton active paragraph={{ rows: 6 }} />}

      {empty && (
        <section className="empty-state" aria-labelledby="empty-title">
          <div className="empty-state__art" aria-hidden="true">
            <span /><span /><span />
          </div>
          <h2 id="empty-title">Let's build your first resume</h2>
          <p className="muted">
            Start from a blank template, or upload the resume you already have and we'll
            organise it for you — you review everything before it's used.
          </p>
          <div className="dashboard__cta dashboard__cta--center">
            <Button type="primary" size="large" icon={<FileAddOutlined />} onClick={() => navigate("/create")}>
              Create resume
            </Button>
            <Button size="large" icon={<UploadOutlined />} onClick={() => navigate("/upload")}>
              Upload existing resume
            </Button>
          </div>
        </section>
      )}

      {items.length > 0 && (
        <>
          <section aria-labelledby="recent-title" className="dashboard__section">
            <h2 id="recent-title" className="section-title">Recent</h2>
            <div className="rgrid">
              {items.slice(0, 3).map((resume) => (
                <ResumeCard key={`recent-${resume.id}`} resume={resume} />
              ))}
            </div>
          </section>

          <section aria-labelledby="all-title" className="dashboard__section">
            <h2 id="all-title" className="section-title">All resumes</h2>
            <MyResume />
          </section>
        </>
      )}

      <section aria-labelledby="templates-title" className="dashboard__section" id="templates">
        <h2 id="templates-title" className="section-title">Template gallery</h2>
        <p className="muted">
          Choose a design to start a new resume. You can switch templates later without losing
          anything.
        </p>
        <TemplateGallery
          onSelect={(templateId) => {
            message.info("Opening that template…");
            navigate(`/create?template=${templateId}`);
          }}
        />
      </section>
    </div>
  );
}
