import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import * as api from "../../database/request";
import type { NewResume } from "../../database/request";
import type { ResumeDoc } from "../../types/resume";

import { setUser } from "./authSlice";

interface ResumeListState {
  items: ResumeDoc[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
}

const initialState: ResumeListState = {
  items: [],
  status: "idle",
  error: null,
};

export const loadResumes = createAsyncThunk("resumes/load", (uid: string) =>
  api.listResumes(uid),
);

export const createResume = createAsyncThunk(
  "resumes/create",
  (args: { uid: string; resume: NewResume }) =>
    api.createResume(args.uid, args.resume),
);

export const renameResume = createAsyncThunk(
  "resumes/rename",
  async (args: { uid: string; id: string; title: string }) => ({
    id: args.id,
    title: await api.renameResume(args.uid, args.id, args.title),
  }),
);

export const duplicateResume = createAsyncThunk(
  "resumes/duplicate",
  (args: { uid: string; resume: ResumeDoc }) =>
    api.duplicateResume(args.uid, args.resume),
);

export const deleteResume = createAsyncThunk(
  "resumes/delete",
  async (args: { uid: string; resume: ResumeDoc }) => {
    await api.deleteResume(args.uid, args.resume);
    return args.resume.id;
  },
);

const sortNewest = (items: ResumeDoc[]) =>
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

const resumeSlice = createSlice({
  name: "resumes",
  initialState,
  reducers: {
    /** Keep the list in step with an edit made in the editor. */
    upsertLocal(state, action: PayloadAction<ResumeDoc>) {
      const index = state.items.findIndex((r) => r.id === action.payload.id);
      if (index === -1) state.items.push(action.payload);
      else state.items[index] = action.payload;
      sortNewest(state.items);
    },
  },
  extraReducers: (builder) => {
    builder
      // A different person on the same browser must never see the last list.
      .addCase(setUser, (state, action) => {
        if (!action.payload) Object.assign(state, initialState);
      })
      .addCase(loadResumes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadResumes.fulfilled, (state, action) => {
        state.status = "ready";
        state.items = action.payload;
      })
      .addCase(loadResumes.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Could not load your resumes.";
      })
      .addCase(createResume.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(renameResume.fulfilled, (state, action) => {
        const item = state.items.find((r) => r.id === action.payload.id);
        if (item) {
          item.title = action.payload.title;
          item.updatedAt = new Date().toISOString();
        }
        sortNewest(state.items);
      })
      .addCase(duplicateResume.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteResume.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });
  },
});

export const { upsertLocal } = resumeSlice.actions;

export default resumeSlice.reducer;
