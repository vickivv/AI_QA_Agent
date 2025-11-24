"use client";
import React from "react";
import { Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hook";
import { searchAndExpand } from "../store/explorerSlice";
import buildTree from "../utils/buildTree";

export default function SearchBar() {
  const dispatch = useAppDispatch();

  const files = useAppSelector((s) => s.file.files);
  const folders = useAppSelector((s) => s.folderReducer.folders);
  const tree = buildTree(files, folders);

  const [q, setQ] = React.useState("");

  const handleSearch = (value: string) => {
    dispatch(searchAndExpand({ files: tree, query: value }));
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border rounded px-2 py-1 bg-white">
        <Search className="w-4 h-4 text-gray-500 mr-2" />

        <input
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            handleSearch(value);
          }}
          placeholder="Search files..."
          className="outline-none text-sm w-40"
        />
      </div>

      <button
        onClick={() => handleSearch(q)}
        className="px-2 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-500"
      >
        Search
      </button>
    </div>
  );
}
