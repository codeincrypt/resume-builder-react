import { AutoComplete, Checkbox, Col, Input, Row, Select } from "antd";

import { JOB_TITLE_SUGGESTIONS, LANGUAGE_LEVELS, SKILL_SUGGESTIONS } from "../../constants/content";
import {
  blankCustomEntry,
  blankEntry,
  newId,
} from "../../types/resume";
import type { CustomSection } from "../../types/resume";
import {
  AddButton,
  BulletsEditor,
  EntryCard,
  Field,
  FormShell,
  MonthField,
  TagsField,
  move,
} from "./fields";
import type { SectionFormProps } from "./fields";

const text = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value : fallback;

/* ---------------------------------------------------------------- personal */

export function PersonalForm({ content, update, issues }: SectionFormProps) {
  const p = content.personal;
  const set = (key: keyof typeof p) => (e: { target: { value: string } }) =>
    update((c) => {
      c.personal[key] = e.target.value;
    });

  return (
    <FormShell>
      <Row gutter={12}>
        <Col xs={24} sm={12}>
          <Field label="Full name" path="personal.fullName" issues={issues}>
            <Input value={p.fullName} onChange={set("fullName")} maxLength={80} autoComplete="name" />
          </Field>
        </Col>
        <Col xs={24} sm={12}>
          <Field label="Professional title" path="personal.jobTitle" issues={issues}>
            <AutoComplete
              style={{ width: "100%" }}
              value={p.jobTitle}
              options={JOB_TITLE_SUGGESTIONS.map((value) => ({ value }))}
              filterOption={(input, option) =>
                (option?.value ?? "").toLowerCase().includes(input.toLowerCase())
              }
              maxLength={80}
              onChange={(value) =>
                update((c) => {
                  c.personal.jobTitle = value;
                })
              }
            />
          </Field>
        </Col>
        <Col xs={24} sm={12}>
          <Field label="Email" path="personal.email" issues={issues}>
            <Input type="email" value={p.email} onChange={set("email")} autoComplete="email" maxLength={120} />
          </Field>
        </Col>
        <Col xs={24} sm={12}>
          <Field label="Phone" path="personal.phone" issues={issues}>
            <Input type="tel" value={p.phone} onChange={set("phone")} autoComplete="tel" maxLength={40} />
          </Field>
        </Col>
        <Col xs={24}>
          <Field label="Location" path="personal.location" issues={issues}>
            <Input value={p.location} onChange={set("location")} placeholder="City, Country" maxLength={100} />
          </Field>
        </Col>
        <Col xs={24} sm={12}>
          <Field label="LinkedIn" path="personal.linkedin" issues={issues}>
            <Input value={p.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/…" maxLength={200} />
          </Field>
        </Col>
        <Col xs={24} sm={12}>
          <Field label="Portfolio / website" path="personal.website" issues={issues}>
            <Input value={p.website} onChange={set("website")} placeholder="yoursite.com" maxLength={200} />
          </Field>
        </Col>
        <Col xs={24} sm={12}>
          <Field label="GitHub" path="personal.github" issues={issues}>
            <Input value={p.github} onChange={set("github")} placeholder="github.com/…" maxLength={200} />
          </Field>
        </Col>
      </Row>
    </FormShell>
  );
}

/* ----------------------------------------------------------------- summary */

export function SummaryForm({ content, update, issues }: SectionFormProps) {
  return (
    <FormShell>
      <Field label="Professional summary" path="summary" issues={issues} extra={`${content.summary.length}/4000`}>
        <Input.TextArea
          value={content.summary}
          autoSize={{ minRows: 4, maxRows: 12 }}
          maxLength={4000}
          placeholder="Two to four sentences on who you are and what you do best."
          onChange={(e) =>
            update((c) => {
              c.summary = e.target.value;
            })
          }
        />
      </Field>
    </FormShell>
  );
}

/* -------------------------------------------------------------- experience */

export function ExperienceForm({ content, update, issues }: SectionFormProps) {
  const list = content.experience;
  return (
    <FormShell>
      {list.map((item, i) => {
        const key = (f: string) => `experience.${item.id}.${f}`;
        const flagged = Object.keys(issues ?? {}).some((p) => p.startsWith(`experience.${item.id}.`));
        return (
          <EntryCard
            key={item.id}
            index={i}
            count={list.length}
            flagged={flagged}
            title={text(item.position, `Position ${i + 1}`) + (item.company ? ` · ${item.company}` : "")}
            onMove={(to) => update((c) => move(c.experience, i, to))}
            onRemove={() => update((c) => void c.experience.splice(i, 1))}
          >
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Field label="Job title" path={key("position")} issues={issues}>
                  <Input
                    value={item.position}
                    maxLength={120}
                    onChange={(e) => update((c) => void (c.experience[i].position = e.target.value))}
                  />
                </Field>
              </Col>
              <Col xs={24} sm={12}>
                <Field label="Company" path={key("company")} issues={issues}>
                  <Input
                    value={item.company}
                    maxLength={120}
                    onChange={(e) => update((c) => void (c.experience[i].company = e.target.value))}
                  />
                </Field>
              </Col>
              <Col xs={24}>
                <Field label="Location">
                  <Input
                    value={item.location}
                    maxLength={100}
                    onChange={(e) => update((c) => void (c.experience[i].location = e.target.value))}
                  />
                </Field>
              </Col>
              <Col xs={12}>
                <Field label="Start date" path={key("startDate")} issues={issues}>
                  <MonthField
                    label="Start date"
                    value={item.startDate}
                    onChange={(v) => update((c) => void (c.experience[i].startDate = v))}
                  />
                </Field>
              </Col>
              <Col xs={12}>
                <Field label="End date">
                  <MonthField
                    label="End date"
                    value={item.endDate}
                    disabled={item.current}
                    onChange={(v) => update((c) => void (c.experience[i].endDate = v))}
                  />
                </Field>
              </Col>
              <Col xs={24}>
                <Checkbox
                  checked={item.current}
                  onChange={(e) => update((c) => void (c.experience[i].current = e.target.checked))}
                >
                  I currently work here
                </Checkbox>
              </Col>
            </Row>
            <BulletsEditor
              bullets={item.bullets}
              onChange={(next) => update((c) => void (c.experience[i].bullets = next))}
            />
          </EntryCard>
        );
      })}
      <AddButton label="Add work experience" onClick={() => update((c) => void c.experience.push(blankEntry("experience")))} />
    </FormShell>
  );
}

/* --------------------------------------------------------------- education */

export function EducationForm({ content, update, issues }: SectionFormProps) {
  const list = content.education;
  return (
    <FormShell>
      {list.map((item, i) => {
        const key = (f: string) => `education.${item.id}.${f}`;
        const flagged = Object.keys(issues ?? {}).some((p) => p.startsWith(`education.${item.id}.`));
        return (
          <EntryCard
            key={item.id}
            index={i}
            count={list.length}
            flagged={flagged}
            title={text(item.degree, `Education ${i + 1}`) + (item.institution ? ` · ${item.institution}` : "")}
            onMove={(to) => update((c) => move(c.education, i, to))}
            onRemove={() => update((c) => void c.education.splice(i, 1))}
          >
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Field label="Degree" path={key("degree")} issues={issues}>
                  <Input
                    value={item.degree}
                    maxLength={150}
                    onChange={(e) => update((c) => void (c.education[i].degree = e.target.value))}
                  />
                </Field>
              </Col>
              <Col xs={24} sm={12}>
                <Field label="School / institution" path={key("institution")} issues={issues}>
                  <Input
                    value={item.institution}
                    maxLength={150}
                    onChange={(e) => update((c) => void (c.education[i].institution = e.target.value))}
                  />
                </Field>
              </Col>
              <Col xs={24}>
                <Field label="Location">
                  <Input
                    value={item.location}
                    maxLength={100}
                    onChange={(e) => update((c) => void (c.education[i].location = e.target.value))}
                  />
                </Field>
              </Col>
              <Col xs={12}>
                <Field label="Start date">
                  <MonthField
                    label="Start date"
                    value={item.startDate}
                    onChange={(v) => update((c) => void (c.education[i].startDate = v))}
                  />
                </Field>
              </Col>
              <Col xs={12}>
                <Field label="Graduation date" path={key("endDate")} issues={issues}>
                  <MonthField
                    label="Graduation date"
                    value={item.endDate}
                    onChange={(v) => update((c) => void (c.education[i].endDate = v))}
                  />
                </Field>
              </Col>
            </Row>
            <BulletsEditor
              label="Details (GPA, honours, coursework)"
              bullets={item.bullets}
              onChange={(next) => update((c) => void (c.education[i].bullets = next))}
            />
          </EntryCard>
        );
      })}
      <AddButton label="Add education" onClick={() => update((c) => void c.education.push(blankEntry("education")))} />
    </FormShell>
  );
}

/* ------------------------------------------------------------------ skills */

export function SkillsForm({ content, update }: SectionFormProps) {
  const list = content.skills;
  return (
    <FormShell>
      {list.map((group, i) => (
        <EntryCard
          key={group.id}
          index={i}
          count={list.length}
          title={text(group.name, `Skill group ${i + 1}`)}
          onMove={(to) => update((c) => move(c.skills, i, to))}
          onRemove={() => update((c) => void c.skills.splice(i, 1))}
        >
          <Field label="Group name (optional)" extra="For example “Technical” or “Soft skills”.">
            <Input
              value={group.name}
              maxLength={60}
              onChange={(e) => update((c) => void (c.skills[i].name = e.target.value))}
            />
          </Field>
          <Field label="Skills" extra="Type a skill and press Enter.">
            <TagsField
              label={`Skills in ${text(group.name, `group ${i + 1}`)}`}
              value={group.items}
              suggestions={SKILL_SUGGESTIONS}
              placeholder="Add skills"
              onChange={(next) => update((c) => void (c.skills[i].items = next))}
            />
          </Field>
        </EntryCard>
      ))}
      <AddButton
        label="Add skill group"
        onClick={() => update((c) => void c.skills.push({ id: newId(), name: c.skills.length ? "" : "Technical", items: [] }))}
      />
    </FormShell>
  );
}

/* ---------------------------------------------------------------- projects */

export function ProjectsForm({ content, update }: SectionFormProps) {
  const list = content.projects;
  return (
    <FormShell>
      {list.map((item, i) => (
        <EntryCard
          key={item.id}
          index={i}
          count={list.length}
          title={text(item.name, `Project ${i + 1}`)}
          onMove={(to) => update((c) => move(c.projects, i, to))}
          onRemove={() => update((c) => void c.projects.splice(i, 1))}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Field label="Project name">
                <Input
                  value={item.name}
                  maxLength={120}
                  onChange={(e) => update((c) => void (c.projects[i].name = e.target.value))}
                />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Link">
                <Input
                  value={item.link}
                  maxLength={200}
                  placeholder="github.com/you/project"
                  onChange={(e) => update((c) => void (c.projects[i].link = e.target.value))}
                />
              </Field>
            </Col>
          </Row>
          <Field label="Technologies">
            <TagsField
              label={`Technologies for ${text(item.name, `project ${i + 1}`)}`}
              value={item.technologies}
              suggestions={SKILL_SUGGESTIONS}
              placeholder="Add technologies"
              onChange={(next) => update((c) => void (c.projects[i].technologies = next))}
            />
          </Field>
          <BulletsEditor
            label="Description"
            bullets={item.bullets}
            onChange={(next) => update((c) => void (c.projects[i].bullets = next))}
          />
        </EntryCard>
      ))}
      <AddButton label="Add project" onClick={() => update((c) => void c.projects.push(blankEntry("projects")))} />
    </FormShell>
  );
}

/* ---------------------------------------------------------- certifications */

export function CertificationsForm({ content, update }: SectionFormProps) {
  const list = content.certifications;
  return (
    <FormShell>
      {list.map((item, i) => (
        <EntryCard
          key={item.id}
          index={i}
          count={list.length}
          title={text(item.name, `Certification ${i + 1}`)}
          onMove={(to) => update((c) => move(c.certifications, i, to))}
          onRemove={() => update((c) => void c.certifications.splice(i, 1))}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Field label="Name">
                <Input
                  value={item.name}
                  maxLength={150}
                  onChange={(e) => update((c) => void (c.certifications[i].name = e.target.value))}
                />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Issuer">
                <Input
                  value={item.issuer}
                  maxLength={150}
                  onChange={(e) => update((c) => void (c.certifications[i].issuer = e.target.value))}
                />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Date">
                <MonthField
                  label="Certification date"
                  value={item.date}
                  onChange={(v) => update((c) => void (c.certifications[i].date = v))}
                />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Credential link">
                <Input
                  value={item.link}
                  maxLength={200}
                  onChange={(e) => update((c) => void (c.certifications[i].link = e.target.value))}
                />
              </Field>
            </Col>
          </Row>
        </EntryCard>
      ))}
      <AddButton label="Add certification" onClick={() => update((c) => void c.certifications.push(blankEntry("certifications")))} />
    </FormShell>
  );
}

/* --------------------------------------------------------------- languages */

export function LanguagesForm({ content, update }: SectionFormProps) {
  const list = content.languages;
  return (
    <FormShell>
      {list.map((item, i) => (
        <EntryCard
          key={item.id}
          index={i}
          count={list.length}
          title={text(item.name, `Language ${i + 1}`)}
          onMove={(to) => update((c) => move(c.languages, i, to))}
          onRemove={() => update((c) => void c.languages.splice(i, 1))}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Field label="Language">
                <Input
                  value={item.name}
                  maxLength={40}
                  onChange={(e) => update((c) => void (c.languages[i].name = e.target.value))}
                />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Proficiency">
                <Select
                  style={{ width: "100%" }}
                  allowClear
                  value={item.level || undefined}
                  placeholder="Select proficiency"
                  // An imported level ("B2", "Mother tongue") stays selectable.
                  options={(item.level && !LANGUAGE_LEVELS.includes(item.level)
                    ? [...LANGUAGE_LEVELS, item.level]
                    : LANGUAGE_LEVELS
                  ).map((value) => ({ value, label: value }))}
                  onChange={(v) => update((c) => void (c.languages[i].level = v ?? ""))}
                />
              </Field>
            </Col>
          </Row>
        </EntryCard>
      ))}
      <AddButton label="Add language" onClick={() => update((c) => void c.languages.push(blankEntry("languages")))} />
    </FormShell>
  );
}

/* ------------------------------------------------------------------ awards */

export function AwardsForm({ content, update }: SectionFormProps) {
  const list = content.awards;
  return (
    <FormShell>
      {list.map((item, i) => (
        <EntryCard
          key={item.id}
          index={i}
          count={list.length}
          title={text(item.title, `Award ${i + 1}`)}
          onMove={(to) => update((c) => move(c.awards, i, to))}
          onRemove={() => update((c) => void c.awards.splice(i, 1))}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Field label="Award">
                <Input
                  value={item.title}
                  maxLength={150}
                  onChange={(e) => update((c) => void (c.awards[i].title = e.target.value))}
                />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Awarded by">
                <Input
                  value={item.issuer}
                  maxLength={150}
                  onChange={(e) => update((c) => void (c.awards[i].issuer = e.target.value))}
                />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Date">
                <MonthField
                  label="Award date"
                  value={item.date}
                  onChange={(v) => update((c) => void (c.awards[i].date = v))}
                />
              </Field>
            </Col>
            <Col xs={24}>
              <Field label="Description (optional)">
                <Input.TextArea
                  value={item.description}
                  autoSize={{ minRows: 1, maxRows: 5 }}
                  maxLength={2000}
                  onChange={(e) => update((c) => void (c.awards[i].description = e.target.value))}
                />
              </Field>
            </Col>
          </Row>
        </EntryCard>
      ))}
      <AddButton label="Add award" onClick={() => update((c) => void c.awards.push(blankEntry("awards")))} />
    </FormShell>
  );
}

/* --------------------------------------------------------------- volunteer */

export function VolunteerForm({ content, update, issues }: SectionFormProps) {
  const list = content.volunteer;
  return (
    <FormShell>
      {list.map((item, i) => {
        const key = (f: string) => `volunteer.${item.id}.${f}`;
        const flagged = Object.keys(issues ?? {}).some((p) => p.startsWith(`volunteer.${item.id}.`));
        return (
          <EntryCard
            key={item.id}
            index={i}
            count={list.length}
            flagged={flagged}
            title={text(item.role, `Role ${i + 1}`) + (item.organization ? ` · ${item.organization}` : "")}
            onMove={(to) => update((c) => move(c.volunteer, i, to))}
            onRemove={() => update((c) => void c.volunteer.splice(i, 1))}
          >
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Field label="Role" path={key("role")} issues={issues}>
                  <Input
                    value={item.role}
                    maxLength={120}
                    onChange={(e) => update((c) => void (c.volunteer[i].role = e.target.value))}
                  />
                </Field>
              </Col>
              <Col xs={24} sm={12}>
                <Field label="Organisation" path={key("organization")} issues={issues}>
                  <Input
                    value={item.organization}
                    maxLength={120}
                    onChange={(e) => update((c) => void (c.volunteer[i].organization = e.target.value))}
                  />
                </Field>
              </Col>
              <Col xs={12}>
                <Field label="Start date" path={key("startDate")} issues={issues}>
                  <MonthField
                    label="Start date"
                    value={item.startDate}
                    onChange={(v) => update((c) => void (c.volunteer[i].startDate = v))}
                  />
                </Field>
              </Col>
              <Col xs={12}>
                <Field label="End date">
                  <MonthField
                    label="End date"
                    value={item.endDate}
                    disabled={item.current}
                    onChange={(v) => update((c) => void (c.volunteer[i].endDate = v))}
                  />
                </Field>
              </Col>
              <Col xs={24}>
                <Checkbox
                  checked={item.current}
                  onChange={(e) => update((c) => void (c.volunteer[i].current = e.target.checked))}
                >
                  I currently volunteer here
                </Checkbox>
              </Col>
            </Row>
            <BulletsEditor
              bullets={item.bullets}
              onChange={(next) => update((c) => void (c.volunteer[i].bullets = next))}
            />
          </EntryCard>
        );
      })}
      <AddButton label="Add volunteer experience" onClick={() => update((c) => void c.volunteer.push(blankEntry("volunteer")))} />
    </FormShell>
  );
}

/* ------------------------------------------------------------------ custom */

export function CustomForm({
  section,
  update,
}: {
  section: CustomSection;
  update: SectionFormProps["update"];
}) {
  const find = (c: SectionFormProps["content"]) => c.custom.find((s) => s.id === section.id);
  return (
    <FormShell>
      <Field label="Section title">
        <Input
          value={section.title}
          maxLength={60}
          onChange={(e) => update((c) => void (find(c)!.title = e.target.value))}
        />
      </Field>
      {section.entries.map((entry, i) => (
        <EntryCard
          key={entry.id}
          index={i}
          count={section.entries.length}
          title={text(entry.heading, `Entry ${i + 1}`)}
          onMove={(to) => update((c) => move(find(c)!.entries, i, to))}
          onRemove={() => update((c) => void find(c)!.entries.splice(i, 1))}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Field label="Heading">
                <Input
                  value={entry.heading}
                  maxLength={150}
                  onChange={(e) => update((c) => void (find(c)!.entries[i].heading = e.target.value))}
                />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Subheading">
                <Input
                  value={entry.subheading}
                  maxLength={150}
                  onChange={(e) => update((c) => void (find(c)!.entries[i].subheading = e.target.value))}
                />
              </Field>
            </Col>
            <Col xs={24}>
              <Field label="Date or period">
                <Input
                  value={entry.date}
                  maxLength={60}
                  placeholder="e.g. 2022 or Spring 2021"
                  onChange={(e) => update((c) => void (find(c)!.entries[i].date = e.target.value))}
                />
              </Field>
            </Col>
          </Row>
          <BulletsEditor
            label="Details"
            bullets={entry.bullets}
            onChange={(next) => update((c) => void (find(c)!.entries[i].bullets = next))}
          />
        </EntryCard>
      ))}
      <AddButton
        label="Add entry"
        onClick={() => update((c) => void find(c)!.entries.push(blankCustomEntry()))}
      />
    </FormShell>
  );
}
