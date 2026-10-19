import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { TemplateCategory } from "../../resume/registry";

/**
 * Gallery filter state. Persisted, so the category you were browsing is still
 * selected when you come back — the one piece of UI state worth remembering.
 */
interface GalleryState {
  category: TemplateCategory | "all";
  query: string;
}

const initialState: GalleryState = {
  category: "all",
  query: "",
};

const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {
    setCategory(state, action: PayloadAction<GalleryState["category"]>) {
      state.category = action.payload;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
  },
});

export const { setCategory, setQuery } = templateSlice.actions;

export default templateSlice.reducer;
