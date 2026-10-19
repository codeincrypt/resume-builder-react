import type { ResumeContent } from "../types/resume";

/**
 * A fictional résumé used to preview templates in the gallery, the landing
 * page and the picker. It is never saved and never shown as the user's data.
 */
export const SAMPLE_CONTENT: ResumeContent = {
  personal: {
    fullName: "Alex Morgan",
    jobTitle: "Senior Product Designer",
    email: "alex.morgan@example.com",
    phone: "+1 415 555 0148",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexmorgan",
    website: "alexmorgan.design",
    github: "",
  },
  summary:
    "Product designer with eight years of experience shipping accessible, data-informed interfaces for fintech and developer tools. Comfortable leading discovery through to launch, and mentoring designers along the way.",
  experience: [
    {
      id: "e1",
      position: "Senior Product Designer",
      company: "Northwind Labs",
      location: "San Francisco, CA",
      startDate: "2021-03",
      endDate: "",
      current: true,
      bullets: [
        "Led the redesign of the onboarding flow, lifting activation from 41% to 63% in two quarters.",
        "Built and maintained a design system used by 14 product squads.",
        "Mentored four designers; two were promoted within a year.",
      ],
    },
    {
      id: "e2",
      position: "Product Designer",
      company: "Brightpath",
      location: "Austin, TX",
      startDate: "2018-06",
      endDate: "2021-02",
      current: false,
      bullets: [
        "Shipped a mobile banking app rated 4.8 stars across 120k reviews.",
        "Ran weekly usability sessions that cut support tickets by 27%.",
      ],
    },
  ],
  education: [
    {
      id: "d1",
      degree: "BA, Interaction Design",
      institution: "California College of the Arts",
      location: "San Francisco, CA",
      startDate: "2012-09",
      endDate: "2016-05",
      bullets: [],
    },
  ],
  skills: [
    { id: "s1", name: "Design", items: ["Interaction design", "Prototyping", "Design systems", "User research"] },
    { id: "s2", name: "Tools", items: ["Figma", "Framer", "HTML & CSS", "SQL"] },
    { id: "s3", name: "Soft skills", items: ["Facilitation", "Mentoring", "Storytelling"] },
  ],
  projects: [
    {
      id: "p1",
      name: "Open-source icon set",
      link: "github.com/amorgan/icons",
      technologies: ["SVG", "Figma"],
      bullets: ["800 icons, 12k weekly downloads."],
    },
  ],
  certifications: [
    { id: "c1", name: "Certified Usability Analyst", issuer: "HFI", date: "2019-04", link: "" },
  ],
  languages: [
    { id: "l1", name: "English", level: "Native" },
    { id: "l2", name: "Spanish", level: "Professional" },
  ],
  awards: [
    { id: "a1", title: "Design Excellence Award", issuer: "Brightpath", date: "2020-11", description: "" },
  ],
  volunteer: [
    {
      id: "v1",
      role: "Design mentor",
      organization: "Code for Good",
      startDate: "2019-01",
      endDate: "",
      current: true,
      bullets: ["Coach nonprofit teams on usable, accessible product design."],
    },
  ],
  custom: [],
};
