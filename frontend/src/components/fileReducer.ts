import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FileRecord {
  path: string;
  name: string;
  type: "file";
}

interface FileState {
  files: FileRecord[];
}

const initialState: FileState = {
  files: [
    { path: "src/main.py", name: "main.py", type: "file" },
    { path: "tests/test_main.py", name: "test_main.py", type: "file" },
  ],
};

const fileSlice = createSlice({
  name: "file",
  initialState,
  reducers: {
    addFile(state, action: PayloadAction<{ path: string }>) {
      const { path } = action.payload;
      const name = path.split("/").pop()!;
      if (state.files.some(f => f.path === path)) return;
      state.files.push({ path, name, type: "file" });
    },

    deleteFile(state, action: PayloadAction<{ path: string }>) {
      state.files = state.files.filter((f) => f.path !== action.payload.path);
    },

    renameFile(
      state,
      action: PayloadAction<{ oldPath: string; newPath: string }>
    ) {
      const f = state.files.find((f) => f.path === action.payload.oldPath);
      if (f) {
        f.path = action.payload.newPath;
        f.name = f.path.split("/").pop()!;
      }
    },

    // Update file paths when a folder is renamed
    updateFilePathsAfterFolderRename(
      state,
      action: PayloadAction<{ oldPath: string; newPath: string }>
    ) {
      const { oldPath, newPath } = action.payload;

      state.files.forEach((f) => {
        if (f.path.startsWith(oldPath + "/")) {
          f.path = f.path.replace(oldPath + "/", newPath + "/");
          f.name = f.path.split("/").pop()!;
        }
      });
    },
  },
});

export const {
  addFile,
  deleteFile,
  renameFile,
  updateFilePathsAfterFolderRename,
} = fileSlice.actions;

export default fileSlice.reducer;
