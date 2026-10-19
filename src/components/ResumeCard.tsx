import { useState } from "react";
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { App, Button, Dropdown, Input, Modal, Tag } from "antd";
import { useNavigate } from "react-router-dom";

import { getTemplate } from "../resume/registry";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  deleteResume,
  duplicateResume,
  renameResume,
} from "../store/slices/resumeSlice";
import type { ResumeDoc } from "../types/resume";
import { formatDateTime, timeAgo } from "../utils/dates";
import { downloadResumePdf } from "../utils/pdf";
import TemplateThumb from "./TemplateThumb";

export default function ResumeCard({ resume }: { resume: ResumeDoc }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { message, modal } = App.useApp();
  const uid = useAppSelector((state) => state.auth.user?.uid ?? "");

  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(resume.title);
  const [busy, setBusy] = useState<"pdf" | "rename" | null>(null);

  const open = () => navigate(`/editor/${resume.id}`);

  const download = async () => {
    setBusy("pdf");
    const hide = message.loading("Preparing your PDF…", 0);
    try {
      await downloadResumePdf(resume, resume.title);
      message.success("Your PDF has been downloaded.");
    } catch (error) {
      console.error(error);
      message.error("Couldn't create the PDF. Please try again.");
    } finally {
      hide();
      setBusy(null);
    }
  };

  const rename = async () => {
    setBusy("rename");
    try {
      await dispatch(renameResume({ uid, id: resume.id, title })).unwrap();
      setRenaming(false);
      message.success("Renamed.");
    } catch (error) {
      message.error((error as Error).message || "Couldn't rename it.");
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async () => {
    try {
      await dispatch(duplicateResume({ uid, resume })).unwrap();
      message.success("Duplicated.");
    } catch (error) {
      message.error((error as Error).message || "Couldn't duplicate it.");
    }
  };

  const remove = () => {
    modal.confirm({
      title: `Delete “${resume.title}”?`,
      content: `This permanently deletes the resume${
        resume.originalFile ? " and its uploaded original file" : ""
      }. It can't be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteResume({ uid, resume })).unwrap();
          message.success("Deleted.");
        } catch (error) {
          message.error((error as Error).message || "Couldn't delete it.");
          throw error;
        }
      },
    });
  };

  return (
    <article className="rcard">
      <button type="button" className="rcard__thumb" onClick={open} aria-label={`Continue editing ${resume.title}`}>
        <TemplateThumb doc={resume} />
      </button>
      <div className="rcard__body">
        <div className="rcard__head">
          <h3 className="rcard__title" title={resume.title}>
            {resume.title}
          </h3>
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: [
                { key: "rename", icon: <EditOutlined />, label: "Rename", onClick: () => { setTitle(resume.title); setRenaming(true); } },
                { key: "dup", icon: <CopyOutlined />, label: "Duplicate", onClick: duplicate },
                { type: "divider" },
                { key: "del", icon: <DeleteOutlined />, label: "Delete", danger: true, onClick: remove },
              ],
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`More actions for ${resume.title}`} />
          </Dropdown>
        </div>
        <div className="rcard__meta">
          <Tag>{getTemplate(resume.templateId).name}</Tag>
          {resume.source === "upload" && <Tag color="blue">Imported</Tag>}
        </div>
        <time className="rcard__time" dateTime={resume.updatedAt} title={formatDateTime(resume.updatedAt)}>
          Edited {timeAgo(resume.updatedAt)}
        </time>
        <div className="rcard__actions">
          <Button type="primary" onClick={open}>
            Continue editing
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={busy === "pdf"}
            onClick={download}
            aria-label={`Download PDF of ${resume.title}`}
          >
            PDF
          </Button>
        </div>
      </div>

      <Modal
        title="Rename resume"
        open={renaming}
        onCancel={() => setRenaming(false)}
        onOk={rename}
        okText="Save"
        confirmLoading={busy === "rename"}
        okButtonProps={{ disabled: !title.trim() }}
        destroyOnHidden
      >
        <Input
          autoFocus
          value={title}
          maxLength={120}
          aria-label="Resume name"
          onChange={(e) => setTitle(e.target.value)}
          onPressEnter={() => title.trim() && rename()}
        />
      </Modal>
    </article>
  );
}
