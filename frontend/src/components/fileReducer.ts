// fileReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// --- 1. INTERFACE DEFINITIONS ---
interface File {
  _id: string;
  name: string;
  content: string; 
  folderId?: string; 
}

interface FilesState {
  files: File[];
  selectedId?: string;
}

// --- 2. INITIAL STATE ---
const initialState: FilesState = {
  files: [
    { _id: "file1", name: "main.py", content: "", folderId: "folder1" },
    { _id: "file3", name: "test_main.py", content: "", folderId: "folder2" }
  ],
  selectedId: "file1",
};

// --- 3. PAYLOAD INTERFACES ---
interface RenameFilePayload {
  fileId: string;
  newName: string;
}

interface AddFilePayload {
  name: string;
  content: string;
  folderId?: string;
  _id: string | null;
}

interface DeleteFilePayload {
  fileId: string;
}

// --- 4. FILE SLICE ---
export const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {

    addFile: (state, action: PayloadAction<AddFilePayload>) => {
      const newFile: File = {
        _id: uuidv4(),
        name: action.payload.name,
        content: action.payload.content,
        folderId: action.payload.folderId,
      };
      state.files.push(newFile);
    },

    deleteFile: (state, action: PayloadAction<DeleteFilePayload>) => {       
      const { fileId } = action.payload;
      console.log('deleteFile reducer called with fileId:', fileId);
      console.log('Before delete, files:', state.files);
      state.files = state.files.filter(f => f._id !== fileId);
      console.log('After delete, files:', state.files);
    },

    renameFile: (state, action: PayloadAction<RenameFilePayload>) => {
      const { fileId, newName } = action.payload; 
      const fileToUpdate = state.files.find(f => f._id === fileId);      
      if (fileToUpdate) {
        fileToUpdate.name = newName;
      }
    },
    selectFile(state, { payload }: PayloadAction<string>) {
      state.selectedId = payload;
    },
    updateContent(
      state,
      { payload }: PayloadAction<{ id: string; text: string }>
    ) {
      const f = state.files.find(x => x._id === payload.id);
      if (f) f.content = payload.text;
    }
  },
});

// --- 5. EXPORTS ---
export const { addFile, deleteFile, renameFile, selectFile, updateContent } = fileSlice.actions;
export default fileSlice.reducer;