// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";

import fileReducer from "./fileReducer";
import folderReducer from "./folderReducer";
import explorerReducer from "./explorerSlice";

export const store = configureStore({
  reducer: {
    file: fileReducer,
    folderReducer: folderReducer,
    explorer: explorerReducer,
  },
});

// Type helpers
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
