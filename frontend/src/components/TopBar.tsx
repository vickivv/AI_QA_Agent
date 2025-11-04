// TopBar.tsx
import React from 'react';
import { Files, Play, Settings } from "lucide-react";
import SearchBar from './SearchBar';
import type { PyodideInterface } from 'pyodide';
import type { TreeItem } from "./RenderTrees";

interface TopBarProps {
    onRunCode: () => void;
    isPyodideReady: boolean; // If need to disable the button based on Pyodide:
    files: TreeItem[];
}

const TopBar: React.FC<TopBarProps> = ({ onRunCode, isPyodideReady, files }) => (
    <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">AI TestGen</h1>
            <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
                    <Files className="w-4 h-4" /> Files
                </button>
                <button
                    onClick={onRunCode}
                    // Disable button if Pyodide is still loading
                    disabled={!isPyodideReady}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5 disabled:opacity-50"
                >
                    <Play className="w-4 h-4" /> Run
                </button>
                <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
                    <Settings className="w-4 h-4" /> Settings
                </button>
            </div>
        </div>
        <div className="flex items-center">
            {/* Pass the file structure down to the SearchBar */}
            <SearchBar files={files} />
        </div>
    </div>
);

export default TopBar;