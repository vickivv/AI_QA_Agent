import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import folders from "../Database";
import { v4 as uuidv4 } from "uuid";

// --- 1. INTERFACE DEFINITIONS ---

interface FileReference {
  _id: string;
  name: string;
  folder: string;
}

interface Folder {
  _id: string;
  name: string;
  files: FileReference[];
}

interface FoldersState {
  folders: Folder[];
}

// --- 2. INITIAL STATE ---

// The 'folders' variable imported from "../Database" must be compatible with Folder[]
const initialState: FoldersState = {
 folders: folders as Folder[], 
};

// --- 3. PAYLOAD INTERFACES (Action Input Types) ---

interface AddNewFolderPayload {
  name: string; // The only data needed to create a new folder
}

interface DeleteFolderPayload {
  folderId: string;
}

interface UpdateFolderNamePayload {
  folderId: string;
  newName: string;
}

// --- 4. FOLDERS SLICE ---

const foldersSlice = createSlice({
    name: "folders",
    initialState,
    reducers: {
        // Reducer 1: Add New Folder
        addNewFolder: (state, action: PayloadAction<AddNewFolderPayload>) => {
            const { name } = action.payload;
            const newFolder: Folder = {
                _id: uuidv4(),
                files: [],
                name: name,
            };
            state.folders.push(newFolder);
        },

        // Reducer 2: Delete Folder
        deleteFolder: (state, action: PayloadAction<DeleteFolderPayload>) => {
            const { folderId } = action.payload; 
            state.folders = state.folders.filter((f) => f._id !== folderId);
        },
        
        // Reducer 3: Update Folder Name
        updateFolderName: (state, action: PayloadAction<UpdateFolderNamePayload>) => {
            const { folderId, newName } = action.payload;
            const folderToUpdate = state.folders.find(f => f._id === folderId);    
            if (folderToUpdate) {
                folderToUpdate.name = newName;
            }
        },
    }
});

export const { addNewFolder, deleteFolder, updateFolderName } = foldersSlice.actions;

export default foldersSlice.reducer;