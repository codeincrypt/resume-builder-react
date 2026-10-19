import { useState } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Badge, Button, Checkbox, Collapse, Modal, Space, Tooltip } from "antd";
import type { CollapseProps } from "antd";

import type { CustomSection, ResumeContent, SectionConfig } from "../../types/resume";
import { SECTION_TITLES, isBuiltinSection, newId } from "../../types/resume";
import { move } from "./fields";
import type { IssueMap, Update } from "./fields";
import {
  AwardsForm,
  CertificationsForm,
  CustomForm,
  EducationForm,
  ExperienceForm,
  LanguagesForm,
  PersonalForm,
  ProjectsForm,
  SkillsForm,
  SummaryForm,
  VolunteerForm,
} from "./SectionForms";

/** The slice of a résumé this panel edits; both `ResumeDoc` and the upload
 *  review draft satisfy it. */
export interface EditableDoc {
  content: ResumeContent;
  sections: SectionConfig[];
}

export type EditDoc = (recipe: (draft: EditableDoc) => void) => void;

function countOf(content: ResumeContent, id: string): number {
  switch (id) {
    case "summary":
      return content.summary.trim() ? 1 : 0;
    case "experience":
      return content.experience.length;
    case "education":
      return content.education.length;
    case "skills":
      return content.skills.reduce((n, g) => n + g.items.length, 0);
    case "projects":
      return content.projects.length;
    case "certifications":
      return content.certifications.length;
    case "languages":
      return content.languages.length;
    case "awards":
      return content.awards.length;
    case "volunteer":
      return content.volunteer.length;
    default:
      return content.custom.find((c) => c.id === id)?.entries.length ?? 0;
  }
}

interface Props {
  doc: EditableDoc;
  edit: EditDoc;
  issues?: IssueMap;
  /** Sections to open initially (the review screen opens flagged ones). */
  defaultOpen?: string[];
}

export default function SectionsPanel({ doc, edit, issues, defaultOpen }: Props) {
  const [open, setOpen] = useState<string[]>(defaultOpen ?? ["personal"]);
  const { content } = doc;
  const update: Update = (recipe) => edit((d) => recipe(d.content));

  const hasIssue = (prefix: string) =>
    !!issues && Object.keys(issues).some((p) => p === prefix || p.startsWith(`${prefix}.`) || p === `section.${prefix}` || p === `custom.${prefix}`);

  const formFor = (id: string) => {
    const props = { content, update, issues };
    switch (id) {
      case "summary":
        return <SummaryForm {...props} />;
      case "experience":
        return <ExperienceForm {...props} />;
      case "education":
        return <EducationForm {...props} />;
      case "skills":
        return <SkillsForm {...props} />;
      case "projects":
        return <ProjectsForm {...props} />;
      case "certifications":
        return <CertificationsForm {...props} />;
      case "languages":
        return <LanguagesForm {...props} />;
      case "awards":
        return <AwardsForm {...props} />;
      case "volunteer":
        return <VolunteerForm {...props} />;
      default: {
        const section = content.custom.find((c) => c.id === id);
        return section ? <CustomForm section={section} update={update} /> : null;
      }
    }
  };

  const titleOf = (id: string) =>
    isBuiltinSection(id)
      ? SECTION_TITLES[id]
      : content.custom.find((c) => c.id === id)?.title || "Custom section";

  const removeCustom = (id: string) => {
    Modal.confirm({
      title: `Delete “${titleOf(id)}”?`,
      content: "This removes the section and everything in it.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: () =>
        edit((d) => {
          d.content.custom = d.content.custom.filter((c: CustomSection) => c.id !== id);
          d.sections = d.sections.filter((s) => s.id !== id);
        }),
    });
  };

  const addCustom = () => {
    const id = newId();
    edit((d) => {
      d.content.custom.push({ id, title: "Additional information", entries: [] });
      d.sections.push({ id, visible: true, pageBreakBefore: false });
    });
    setOpen((keys) => [...keys, id]);
  };

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  const items: CollapseProps["items"] = [
    {
      key: "personal",
      label: (
        <span className="section-label">
          Personal information
          {hasIssue("personal") && <Badge status="warning" className="section-label__flag" />}
        </span>
      ),
      children: <PersonalForm content={content} update={update} issues={issues} />,
    },
    ...doc.sections.map((config, index) => {
      const count = countOf(content, config.id);
      const flagged = hasIssue(config.id);
      return {
        key: config.id,
        className: config.visible ? undefined : "section-hidden",
        label: (
          <span className="section-label">
            {titleOf(config.id)}
            {count > 0 && <span className="section-label__count">{count}</span>}
            {!config.visible && <span className="section-label__hidden">Hidden</span>}
            {flagged && <Badge status="warning" className="section-label__flag" />}
          </span>
        ),
        extra: (
          <Space size={0} onClick={stop} onKeyDown={stop}>
            <Tooltip title={config.visible ? "Hide from resume" : "Show on resume"}>
              <Button
                size="small"
                type="text"
                icon={config.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                aria-label={`${config.visible ? "Hide" : "Show"} ${titleOf(config.id)}`}
                aria-pressed={!config.visible}
                onClick={() => edit((d) => void (d.sections[index].visible = !d.sections[index].visible))}
              />
            </Tooltip>
            <Tooltip title="Move section up">
              <Button
                size="small"
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                aria-label={`Move ${titleOf(config.id)} up`}
                onClick={() => edit((d) => move(d.sections, index, index - 1))}
              />
            </Tooltip>
            <Tooltip title="Move section down">
              <Button
                size="small"
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={index === doc.sections.length - 1}
                aria-label={`Move ${titleOf(config.id)} down`}
                onClick={() => edit((d) => move(d.sections, index, index + 1))}
              />
            </Tooltip>
            {!isBuiltinSection(config.id) && (
              <Tooltip title="Delete section">
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Delete ${titleOf(config.id)}`}
                  onClick={() => removeCustom(config.id)}
                />
              </Tooltip>
            )}
          </Space>
        ),
        children: (
          <>
            {formFor(config.id)}
            <Checkbox
              className="section-pagebreak"
              checked={config.pageBreakBefore}
              onChange={(e) =>
                edit((d) => void (d.sections[index].pageBreakBefore = e.target.checked))
              }
            >
              Start this section on a new page
            </Checkbox>
          </>
        ),
      };
    }),
  ];

  return (
    <div className="sections-panel">
      <Collapse
        items={items}
        activeKey={open}
        onChange={(keys) => setOpen(Array.isArray(keys) ? keys : [keys])}
      />
      <Button
        className="sections-panel__add"
        block
        icon={<PlusOutlined />}
        onClick={addCustom}
      >
        Add custom section
      </Button>
    </div>
  );
}
