export const itSkills = [
  "Programming Languages",
  "Web Development",
  "Database Management",
  "Networking",
  "Cybersecurity",
  "Cloud Computing",
  "Operating Systems",
  "Data Analysis",
  "Software Development",
  "Project Management",
  "Machine Learning",
  "Artificial Intelligence",
  "Mobile App Development",
  "DevOps",
  "Virtualization",
  "IT Support",
  "Systems Administration",
  "Business Intelligence",
  "IT Troubleshooting",
  "Automation",
  "Agile Methodology",
  "UI/UX Design",
  "Big Data",
  "Internet of Things (IoT)",
  "Blockchain",
  "Digital Marketing",
  "Version Control",
  "API Development",
  "Linux Administration",
  "Windows Administration",
  "SQL",
  "JavaScript",
  "Python",
  "Java",
  "C/C++",
  "Ruby",
  "PHP",
  "HTML/CSS",
  "React",
  "Angular",
  "Node.js",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "VMware",
  "Ethical Hacking",
  "Penetration Testing",
  "Incident Response",
  "Firewall Configuration",
  "Data Encryption",
  "IT Compliance",
  "Risk Management",
  "IT Strategy",
];

export const resumeTemplate = [
  {
    id: 1,
    name: "Toronto",
    url: "https://res.cloudinary.com/dpevovkcg/image/upload/v1733569188/resume-builder/dr1au44h7hsb6mzlck5x.webp"
  },
  {
    id: 2,
    name: "Stockholm",
    url: "https://res.cloudinary.com/dpevovkcg/image/upload/v1733569188/resume-builder/dr1au44h7hsb6mzlck5x.webp"
  },
  {
    id: 3,
    name: "London",
    url: "https://res.cloudinary.com/dpevovkcg/image/upload/v1733569188/resume-builder/ywboxgadnw91pd0h1kyu.webp"
  },
  {
    id: 4,
    name: "Toronto",
    url: "https://res.cloudinary.com/dpevovkcg/image/upload/v1733569188/resume-builder/dr1au44h7hsb6mzlck5x.webp"
  },
  {
    id: 5,
    name: "Stockholm",
    url: "https://res.cloudinary.com/dpevovkcg/image/upload/v1733569188/resume-builder/dr1au44h7hsb6mzlck5x.webp"
  },
  {
    id: 6,
    name: "London",
    url: "https://res.cloudinary.com/dpevovkcg/image/upload/v1733569188/resume-builder/ywboxgadnw91pd0h1kyu.webp"
  },
]

const selectSkill = (skill) => {
  setSkills(skills.filter((s) => s !== skill));
  setSelectedSkills([...selectedSkills, skill]);
};

const removeSelectedSkill = (skill) => {
  setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  setSkills([...skills, skill]);
};
