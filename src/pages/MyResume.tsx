import { useMemo, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Empty, Input, Select } from "antd";

import ResumeCard from "../components/ResumeCard";
import { getTemplate } from "../resume/registry";
import { useAppSelector } from "../store/hooks";

type Sort = "edited" | "created" | "az" | "za";
type Filter = "all" | "scratch" | "upload";

/** "All resumes": search, sort and filter over the signed-in user's list. */
export default function MyResume() {
  const items = useAppSelector((state) => state.resumes.items);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("edited");
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((r) => filter === "all" || r.source === filter)
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          getTemplate(r.templateId).name.toLowerCase().includes(q) ||
          r.content.personal.fullName.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        switch (sort) {
          case "az":
            return a.title.localeCompare(b.title);
          case "za":
            return b.title.localeCompare(a.title);
          case "created":
            return b.createdAt.localeCompare(a.createdAt);
          default:
            return b.updatedAt.localeCompare(a.updatedAt);
        }
      });
  }, [items, query, sort, filter]);

  return (
    <div>
      <div className="list-controls">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search your resumes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search your resumes"
        />
        <Select<Filter>
          value={filter}
          onChange={setFilter}
          aria-label="Filter resumes"
          options={[
            { value: "all", label: "All resumes" },
            { value: "scratch", label: "Created from scratch" },
            { value: "upload", label: "Imported from a file" },
          ]}
        />
        <Select<Sort>
          value={sort}
          onChange={setSort}
          aria-label="Sort resumes"
          options={[
            { value: "edited", label: "Last edited" },
            { value: "created", label: "Newest created" },
            { value: "az", label: "Name A–Z" },
            { value: "za", label: "Name Z–A" },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <Empty description="No resumes match your search" />
      ) : (
        <p className="visually-hidden" role="status" aria-live="polite">
          {shown.length} resumes shown
        </p>
      )}
      <div className="rgrid">
        {shown.map((resume) => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}
      </div>
    </div>
  );
}
