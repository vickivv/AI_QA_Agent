"use client";
import React, { useRef } from "react";
import { Files, Play, Settings, ClipboardCheck, Upload } from "lucide-react";
import SearchBar from "./SearchBar";

interface TopBarProps {
  onRunCode: () => void;
  onRunTests: () => void;
  isReady: boolean;
  coverage: number | null;
  onFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings: () => void;
}


const TopBar: React.FC<TopBarProps> = ({ onRunCode, onRunTests, isReady, coverage, onFileUpload, onOpenSettings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null); //ref for file input
  return (
    <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">AI TestGen</h1>

        <div className="flex gap-2">

          <button
            onClick={() => {
              console.log("Run clicked!");
              onRunCode();
            }}
            disabled={!isReady}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Run
          </button>

          <button
            onClick={onRunTests}
            disabled={!isReady}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5 disabled:opacity-50"
          >
            <ClipboardCheck className="w-4 h-4" /> Run Tests
          </button>

          {onFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py"
                onChange={onFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Upload
              </button>
            </>
          )}

          <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Settings button clicked');
              onOpenSettings();
            }}>
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* Right Section: Search */}
      <div className="flex items-center gap-4">
        {coverage !== null && (
          <div className="text-sm text-gray-700 font-medium px-3 py-1 bg-gray-100 rounded">
            Test Coverage: <span className="text-blue-600">{coverage}%</span>
          </div>
        )}
        <SearchBar />
      </div>
    </div>
  );
};

export default TopBar;
