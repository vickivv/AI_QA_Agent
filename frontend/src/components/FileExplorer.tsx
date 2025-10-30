import React, { useState } from "react";
import { FileCode, FolderOpen, FolderClosed, Plus, Trash2, Edit } from "lucide-react";

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
  const [focusedItem, setFocusedItem] = useState<string | null>(null);

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

  const deleteItem = (name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    const updatedFiles = files.filter(item => item.name !== name);
    onUpdateFiles(updatedFiles);
    // Clear selection and focus after deletion
    if (selectedFile === name) {
      onSelectFile("");
    }
    setFocusedItem(null);
  };

  const renameItem = (oldName: string) => {
    const newName = prompt(`Rename ${oldName} to:`, oldName);
    if (!newName || newName === oldName) return;
    const updatedFiles = files.map(item =>
      item.name === oldName ? { ...item, name: newName } : item
    );
    onUpdateFiles(updatedFiles);
    if (selectedFile === oldName) {
      onSelectFile(newName);
    }
    setFocusedItem(null);
  };

  const renderTree = (items: FileItem[], depth = 0) =>
    items.map((item, i) => (
      <div key={i}>
        {item.type === "folder" ? (
          <>
            {/* 1. Folder Row Container */}
            <div
              // Classes to handle layout, hovering, and identifying the group for deletion button visibility
              className="group flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
              // Indentation style based on recursion depth
              style={{ paddingLeft: `${depth * 12 + 12}px` }}

              // Click handlers: single click focuses/toggles, double click (assumed) would open
              onClick={() => setFocusedItem(item.name)}
              onDoubleClick={() => toggleFolder(item.name)}
            >
              <div className="flex items-center gap-2 pointer-events-none">
                {/* 2. Folder Icon */}
                {expandedFolders[item.name] ? (
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <FolderClosed className="w-4 h-4 text-blue-500" />
                )}
                {/* 3. Folder Name */}
                <span className="text-gray-700">{item.name}</span>
              </div>

              {/* 4. Context Menu / Action Buttons */}
              {focusedItem === item.name && (
                <div className="absolute right-0 top-0 mt-1 mr-1 flex bg-white border border-gray-300 shadow-lg rounded z-20">
                  <button
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents folder toggle
                      renameItem(item.name);
                    }}
                    className="p-1.5 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents folder toggle
                      deleteItem(item.name);
                    }}
                    className="p-1.5 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>

            {/* 5. Recursive Call (Rendering Children) */}
            {expandedFolders[item.name] && item.children && renderTree(item.children, depth + 1)}
          </>
        ) : (
          <div
              className={`group flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm relative ${selectedFile === item.name ? "bg-blue-50 border-l-2 border-blue-500" : ""
                } ${focusedItem === item.name ? "bg-gray-200" : ""}`} // Highlight focused item
              style={{ paddingLeft: `${depth * 12 + 12}px` }}

              // SINGLE CLICK to focus for context menu
              onClick={() => setFocusedItem(item.name)}

              // DOUBLE CLICK to open/select file for editor
              onDoubleClick={() => {
                setFocusedItem(null); // Clear context focus
                onSelectFile(item.name); // Select the file
              }}
            >
              <div className="flex items-center gap-2 flex-1 pointer-events-none">
                <FileCode className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{item.name}</span>
              </div>
              {/* --- NEW CONTEXT MENU (CONDITIONAL RENDERING) --- */}
              {focusedItem === item.name && (
                <div className="absolute right-0 top-0 mt-1 mr-1 flex bg-white border border-gray-300 shadow-lg rounded z-20">
                  <button
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop dblclick/click from propagating
                      renameItem(item.name);
                    }}
                    className="p-1.5 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop dblclick/click from propagating
                      deleteItem(item.name);
                    }}
                    className="p-1.5 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
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
