import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { TreeItem, FolderNode } from "./RenderTreesTypes";

// State
interface ExplorerState {
  expandedByPath: Record<string, boolean>;
  searchHits: string[];
  selectedFolder: string; // "" means root
}

const initialState: ExplorerState = {
  expandedByPath: {},
  searchHits: [],
  selectedFolder: "",
};

// Helpers
const join = (base: string, name: string) =>
  base ? `${base}/${name}` : name;

// Iterating over the tree recursively to find matches
const findMatches = (items: TreeItem[], q: string): string[] => {
  const hits: string[] = [];
  const needle = q.trim().toLowerCase();
  if (!needle) return hits;

  const walk = (nodes: TreeItem[], base = "") => {
    for (const node of nodes) {
      const path = join(base, node.name);

      // name match → hit
      if (node.name.toLowerCase().includes(needle)) hits.push(path);

      if (node.type === "folder" && node.children) {
        walk(node.children, path);
      }
    }
  };

  walk(items);
  return hits;
};

// Unfold all parent folders based on hits
const expandAncestors = (
  paths: string[],
  prev: Record<string, boolean>
): Record<string, boolean> => {
  const next = { ...prev };

  for (const p of paths) {
    const parts = p.split("/");
    for (let i = 0; i < parts.length - 1; i++) {
      const ancestor = parts.slice(0, i + 1).join("/");
      next[ancestor] = true;
    }
  }

  return next;
};

// Thunk: Search + auto-expand
export const searchAndExpand = createAsyncThunk<
  { hits: string[]; expandedByPath: Record<string, boolean> },
  { files: TreeItem[]; query: string },
  { state: { explorer: ExplorerState } }
>("explorer/searchAndExpand", async ({ files, query }, { getState }) => {
  const hits = findMatches(files, query);
  const expandedByPath = expandAncestors(
    hits,
    getState().explorer.expandedByPath
  );
  return { hits, expandedByPath };
});

// Slice
const explorerSlice = createSlice({
  name: "explorer",
  initialState,
  reducers: {
    toggleFolder(state, action: PayloadAction<string>) {
      const p = action.payload;
      state.expandedByPath[p] = !state.expandedByPath[p];
      state.selectedFolder = p;
    },

    setSelectedFolder(state, action: PayloadAction<string>) {
      state.selectedFolder = action.payload;
    },

    setSearchHits(state, action: PayloadAction<string[]>) {
      state.searchHits = action.payload;
    },

    clearSearch(state) {
      state.searchHits = [];
    },
  },

  extraReducers: (builder) => {
    builder.addCase(searchAndExpand.fulfilled, (state, action) => {
      state.searchHits = action.payload.hits;
      state.expandedByPath = action.payload.expandedByPath;
    });
  },
});

export const {
  toggleFolder,
  setSelectedFolder,
  setSearchHits,
  clearSearch,
} = explorerSlice.actions;

export default explorerSlice.reducer;
