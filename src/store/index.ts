import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "./storage";
import authReducer from "./slices/authSlice";
import resumeReducer from "./slices/resumeSlice";
import templateReducer from "./slices/templateSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  resumes: resumeReducer,
  template: templateReducer,
});

const persistConfig = {
  key: "resume-builder",
  version: 1,
  storage,
  // Only UI preferences persist. The session is Firebase's to keep, and
  // resumes live in Firestore — a persisted copy of either would be stale and,
  // on a shared computer, someone else's.
  whitelist: ["template"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist dispatches these with non-serializable payloads.
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
