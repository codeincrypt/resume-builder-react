import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import userSlice from "./slices/userSlice";
import authSlice from "./slices/authSlice";
import resumeSlice from "./slices/resumeSlice";
import templateSlice from "./slices/templateSlice";

const rootReducer = combineReducers({
  auth    : authSlice,
  user    : userSlice,
  resume  : resumeSlice,
  template: templateSlice,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

// Persist the reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the store
const store = configureStore({
  reducer: persistedReducer,
});

// Set up the persistor
const persistor = persistStore(store);

export { store, persistor };
