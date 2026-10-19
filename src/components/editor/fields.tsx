import { cloneElement, isValidElement, useId } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Select, Space, Tooltip } from "antd";

import type { ParseIssue } from "../../parsing/parseResume";
import type { ResumeContent } from "../../types/resume";
import { fromMonth, toMonth } from "../../utils/dates";

/** Mutate a draft of the content in place; the editor applies it immutably. */
export type Update = (recipe: (content: ResumeContent) => void) => void;
export type IssueMap = Record<string, ParseIssue>;

export interface SectionFormProps {
  content: ResumeContent;
  update: Update;
  issues?: IssueMap;
}

export function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}

/** A labelled control that can carry a parser warning ("check this"). */
export function Field({
  label,
  path,
  issues,
  children,
  extra,
  required,
}: {
  label: string;
  path?: string;
  issues?: IssueMap;
  children: ReactNode;
  extra?: ReactNode;
  required?: boolean;
}) {
  const issue = path ? issues?.[path] : undefined;
  // Tie the visible label to its control (and to the warning text) so screen
  // readers announce them together; Form.Item only does this for named fields.
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; "aria-describedby"?: string }>, {
        id,
        ...(issue ? { "aria-describedby": `${id}-help` } : {}),
      })
    : children;
  return (
    <Form.Item
      label={label}
      htmlFor={id}
      required={required}
      extra={extra}
      validateStatus={issue ? "warning" : undefined}
      help={issue ? <span id={`${id}-help`}>{issue.message}</span> : undefined}
      className={issue ? `field-flag field-flag--${issue.level}` : undefined}
    >
      {control}
    </Form.Item>
  );
}

export function FormShell({ children }: { children: ReactNode }) {
  return (
    <Form layout="vertical" component={false} requiredMark={false}>
      {children}
    </Form>
  );
}

export function MonthField({
  value,
  onChange,
  disabled,
  placeholder,
  label,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label: string;
  id?: string;
}) {
  return (
    <DatePicker
      id={id}
      picker="month"
      format="MMM YYYY"
      style={{ width: "100%" }}
      value={toMonth(value)}
      disabled={disabled}
      placeholder={placeholder ?? "Select month"}
      aria-label={label}
      onChange={(date) => onChange(fromMonth(date))}
    />
  );
}

/** One card per list entry, with reorder and delete. */
export function EntryCard({
  title,
  index,
  count,
  onMove,
  onRemove,
  flagged,
  children,
}: {
  title: string;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  flagged?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`entry-card${flagged ? " entry-card--flagged" : ""}`}>
      <div className="entry-card__head">
        <strong className="entry-card__title">{title}</strong>
        <Space size={2}>
          <Tooltip title="Move up">
            <Button
              size="small"
              type="text"
              icon={<ArrowUpOutlined />}
              disabled={index === 0}
              aria-label={`Move ${title} up`}
              onClick={() => onMove(index - 1)}
            />
          </Tooltip>
          <Tooltip title="Move down">
            <Button
              size="small"
              type="text"
              icon={<ArrowDownOutlined />}
              disabled={index === count - 1}
              aria-label={`Move ${title} down`}
              onClick={() => onMove(index + 1)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={`Delete ${title}`}
              onClick={onRemove}
            />
          </Tooltip>
        </Space>
      </div>
      {children}
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="dashed" block icon={<PlusOutlined />} onClick={onClick}>
      {label}
    </Button>
  );
}

/**
 * Editable bullet list: each point is its own text box and can be reordered
 * or removed — "reorder achievements".
 */
export function BulletsEditor({
  bullets,
  onChange,
  label = "Achievements & responsibilities",
  placeholder = "Describe what you did and the result",
}: {
  bullets: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const set = (next: string[]) => onChange(next);
  return (
    <Form.Item label={label}>
      <div className="bullets-editor">
        {bullets.map((text, i) => (
          <div className="bullets-editor__row" key={i}>
            <Input.TextArea
              value={text}
              autoSize={{ minRows: 1, maxRows: 6 }}
              placeholder={placeholder}
              maxLength={1000}
              aria-label={`${label} ${i + 1}`}
              onChange={(e) => set(bullets.map((b, j) => (j === i ? e.target.value : b)))}
            />
            <Space.Compact>
              <Button
                icon={<ArrowUpOutlined />}
                disabled={i === 0}
                aria-label={`Move point ${i + 1} up`}
                onClick={() => {
                  const next = [...bullets];
                  move(next, i, i - 1);
                  set(next);
                }}
              />
              <Button
                icon={<ArrowDownOutlined />}
                disabled={i === bullets.length - 1}
                aria-label={`Move point ${i + 1} down`}
                onClick={() => {
                  const next = [...bullets];
                  move(next, i, i + 1);
                  set(next);
                }}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                aria-label={`Delete point ${i + 1}`}
                onClick={() => set(bullets.filter((_, j) => j !== i))}
              />
            </Space.Compact>
          </div>
        ))}
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => set([...bullets, ""])}>
          Add point
        </Button>
      </div>
    </Form.Item>
  );
}

/** Free-text tags with optional suggestions (press Enter or comma to add). */
export function TagsField({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  label: string;
  id?: string;
}) {
  return (
    <Select
      id={id}
      mode="tags"
      style={{ width: "100%" }}
      value={value}
      aria-label={label}
      placeholder={placeholder}
      tokenSeparators={[","]}
      options={suggestions?.map((s) => ({ value: s, label: s }))}
      maxTagCount="responsive"
      onChange={(next: string[]) =>
        onChange(next.map((s) => s.trim().slice(0, 60)).filter(Boolean).slice(0, 80))
      }
    />
  );
}
