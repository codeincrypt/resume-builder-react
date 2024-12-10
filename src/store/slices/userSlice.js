import { createSlice } from "@reduxjs/toolkit";

const initialState = {}

const userSlice = createSlice({
  name: "userSlice",
  initialState,

  reducers: {
    addUser: (state, action) => {
      const newUser = action.payload;
      state.push(newUser);
    },
  },
});

export const { addUser } = userSlice.actions;

export default userSlice.reducer;
