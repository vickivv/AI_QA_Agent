import { configureStore } from "@reduxjs/toolkit";
import explorer from "./explorerSlice";

export const store = configureStore({
  reducer: { explorer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;