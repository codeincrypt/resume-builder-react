import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  id: null,
  name: null,
  url: null,
}

const templateSlice = createSlice({
  name: "templateSlice",
  initialState,

  reducers: {
    setTemplate: (state, action) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.url = action.payload.url;
    },
  },
});

export const { setTemplate } = templateSlice.actions;

export default templateSlice.reducer;
