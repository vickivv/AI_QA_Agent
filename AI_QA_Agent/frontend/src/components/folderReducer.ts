import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FolderRecord {
  path: string; // "src/utils"
  name: string; // "utils"
  type: "folder";
}

interface FolderState {
  folders: FolderRecord[];
}

const initialState: FolderState = {
  folders: [
    { path: "src", name: "src", type: "folder" },
    { path: "tests", name: "tests", type: "folder" },
  ],
};

const slice = createSlice({
  name: "folders",
  initialState,
  reducers: {
    addNewFolder(state, action: PayloadAction<{ path: string }>) {
      const path = action.payload.path;
      const name = path.split("/").pop()!;
      state.folders.push({ path, name, type: "folder" });
    },

    deleteFolder(state, action: PayloadAction<{ path: string }>) {
      state.folders = state.folders.filter((f) => f.path !== action.payload.path);
    },

    renameFolder: (
      state,
      action: PayloadAction<{ oldPath: string; newPath: string }>
    ) => {
      const { oldPath, newPath } = action.payload;

      // Update the folder itself
      const folder = state.folders.find(f => f.path === oldPath);
      if (folder) {
        folder.path = newPath;
        folder.name = newPath.split("/").pop()!;
      }

      // Update all subfolders
      state.folders.forEach(f => {
        if (f.path.startsWith(oldPath + "/")) {
          const updated = f.path.replace(oldPath + "/", newPath + "/");
          f.path = updated;
          f.name = updated.split("/").pop()!;
        }
      });
    }
  },
});

export const { addNewFolder, deleteFolder, renameFolder } = slice.actions;
export default slice.reducer;
