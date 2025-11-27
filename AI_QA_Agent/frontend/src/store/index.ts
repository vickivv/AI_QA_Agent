import { configureStore } from "@reduxjs/toolkit";
import explorer from "./explorerSlice";
import fileReducer from "../components/fileReducer"
import folderReducer from "../components/folderReducer"

export const store = configureStore({
  reducer: { explorer, fileReducer, folderReducer },
});
export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;