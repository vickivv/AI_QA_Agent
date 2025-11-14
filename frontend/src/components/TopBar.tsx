"use client";
import React from "react";
import { Files, Play, Settings } from "lucide-react";
import SearchBar from "./SearchBar";

interface TopBarProps {
  onRunCode: () => void;
  isPyodideReady: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onRunCode, isPyodideReady }) => {
  return (
    <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">AI TestGen</h1>

        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
            <Files className="w-4 h-4" /> Files
          </button>

          <button
            onClick={onRunCode}
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

      {/* Right Section: Search */}
      <div className="flex items-center">
        <SearchBar />
      </div>
    </div>
  );
};

export default TopBar;
