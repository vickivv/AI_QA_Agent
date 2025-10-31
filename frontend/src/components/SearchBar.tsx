import React from "react";
import { Search } from "lucide-react";
import { useAppDispatch } from "../store/hook";
import { searchAndExpand } from "../store/explorerSlice";
import type { FileItem } from "../store/explorerSlice";

export default function SearchBar({ files }: { files: FileItem[] }) {
    const dispatch = useAppDispatch();
    const [q, setQ] = React.useState("");
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center border rounded px-2 py-1 bg-white">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && dispatch(searchAndExpand({ files, query: q }))}
                    placeholder="Search files…"
                    className="outline-none text-sm w-40"
                />
            </div>
            <button
                onClick={() => dispatch(searchAndExpand({ files, query: q }))}
                className="px-2 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-500"
            >
                Search
            </button>
        </div>
    );
}