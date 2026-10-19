import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { AuthUser } from "../../types/user";

interface AuthState {
  user: AuthUser | null;
  /** `initializing` until Firebase has reported the stored session once. */
  status: "initializing" | "ready";
}

const initialState: AuthState = {
  user: null,
  status: "initializing",
};

/**
 * Mirrors Firebase Auth. Firebase owns the session (and persists it); this
 * slice is only how React components read it, so it is deliberately not
 * persisted — a stale copy here could outlive a revoked session.
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = "ready";
    },
  },
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
