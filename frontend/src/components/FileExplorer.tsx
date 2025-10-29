import React, { useState } from "react";
import { FileCode, FolderOpen, FolderClosed, Plus } from "lucide-react";

export interface FileItem {
  name: string;
  type: "file" | "folder";
  children?: FileItem[];
}

interface FileExplorerProps {
  files: FileItem[];
  selectedFile: string;
  onSelectFile: (name: string) => void;
  onUpdateFiles: (files: FileItem[]) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onUpdateFiles,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const addNewFile = () => {
    const name = prompt("Enter new file name (e.g., script.py):");
    if (!name) return;
    onUpdateFiles([...files, { name, type: "file" }]);
  };

  const addNewFolder = () => {
    const name = prompt("Enter new folder name:");
    if (!name) return;
    onUpdateFiles([...files, { name, type: "folder", children: [] }]);
  };

  const renderTree = (items: FileItem[], depth = 0) =>
    items.map((item, i) => (
      <div key={i}>
        {item.type === "folder" ? (
          <>
            <div
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
              onClick={() => toggleFolder(item.name)}
            >
              {expandedFolders[item.name] ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <FolderClosed className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-gray-700">{item.name}</span>
            </div>
            {expandedFolders[item.name] && item.children && renderTree(item.children, depth + 1)}
          </>
        ) : (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm ${
              selectedFile === item.name ? "bg-blue-50 border-l-2 border-blue-500" : ""
            }`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={() => onSelectFile(item.name)}
          >
            <FileCode className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{item.name}</span>
          </div>
        )}
      </div>
    ));

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Explorer</h3>
        <div className="flex gap-1">
          <button
            title="Add file"
            onClick={addNewFile}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            title="Add folder"
            onClick={addNewFolder}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <FolderClosed className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{renderTree(files)}</div>
    </div>
  );
};

export default FileExplorer;
