import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface FileItem {
  name: string;
  type: "file" | "folder";
  children?: FileItem[];
}

type State = {
  expandedByPath: Record<string, boolean>;
  searchHits: string[];
};

const initialState: State = {
  expandedByPath: {},
  searchHits: [],
};

const join = (base: string, name: string) => (base ? `${base}/${name}` : name);

const findMatches = (items: FileItem[], q: string): string[] => {
  const hits: string[] = [];
  const needle = q.trim().toLowerCase();
  if (!needle) return hits;
  const walk = (nodes: FileItem[], base = "") => {
    for (const n of nodes) {
      const path = join(base, n.name);
      if (n.name.toLowerCase().includes(needle)) hits.push(path);
      if (n.type === "folder" && n.children) walk(n.children, path);
    }
  };
  walk(items);
  return hits;
};
const expandAncestors = (paths: string[], prev: Record<string, boolean>) => {
  const next = { ...prev };
  for (const p of paths) {
    const parts = p.split("/");
    for (let i = 0; i < parts.length - 1; i++) {
      const folderPath = parts.slice(0, i + 1).join("/");
      next[folderPath] = true;
    }
  }
  return next;
};

// Thunk: performs search using current files tree passed in
export const searchAndExpand = createAsyncThunk<
  { hits: string[]; expandedByPath: Record<string, boolean> },
  { files: FileItem[]; query: string },
  { state: { explorer: State } }
>("explorer/searchAndExpand", async ({ files, query }, { getState }) => {
  const hits = findMatches(files, query);
  const expandedByPath = expandAncestors(hits, getState().explorer.expandedByPath);
  return { hits, expandedByPath };
});

const explorerSlice = createSlice({
  name: "explorer",
  initialState,
  reducers: {
    setExpandedByPath(state, action: PayloadAction<Record<string, boolean>>) {
      state.expandedByPath = action.payload;
    },
    toggleFolder(state, action: PayloadAction<string>) {
      const p = action.payload;
      state.expandedByPath[p] = !state.expandedByPath[p];
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

export const { setExpandedByPath, toggleFolder, setSearchHits, clearSearch } =
  explorerSlice.actions;

export default explorerSlice.reducer;