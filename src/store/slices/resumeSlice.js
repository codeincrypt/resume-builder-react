import { createSlice } from "@reduxjs/toolkit";

const data = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    linkedIn: "",
    github: "",
    address: "",
  },
  summary: "",
  skills: [],
  experience: [
    {
      jobTitle: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],
  education: [
    {
      degree: "",
      institution: "",
      startDate: "",
      endDate: "",
    },
  ],
  certifications: [
    {
      name: "",
      issuingOrganization: "",
      issueDate: "",
    },
  ],
  projects: [
    {
      title: "",
      description: "",
      technologies: [],
      link: "",
    },
  ],
};

const initialState = {
  data : data,
  loading: true,
}

const resumeSlice = createSlice({
  name: "resumeSlice",
  initialState,

  reducers: {
    updateResume: (state, action) => {
      state.data = {...state.data,...action.payload };
      state.loading = false;
    },
  },
});

export const { updateResume } = resumeSlice.actions;

export default resumeSlice.reducer;
