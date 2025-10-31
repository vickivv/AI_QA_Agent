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
  // inside FileExplorer component…

  type CtxTarget = { name: string; type: "file" | "folder" } | null;
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [ctxTarget, setCtxTarget] = useState<CtxTarget>(null);

  // open context menu at cursor, with target info
  const openContextMenu = (
    e: React.MouseEvent,
    target: { name: string; type: "file" | "folder" }
  ) => {
    e.preventDefault();
    e.stopPropagation();
    // Optionally adjust to keep inside viewport
    const padding = 8;
    const x = Math.min(e.clientX, window.innerWidth - 200 - padding); // 200 ~ menu width
    const y = Math.min(e.clientY, window.innerHeight - 160 - padding); // 160 ~ menu height
    setCtxPos({ x, y });
    setCtxTarget(target);
    setCtxOpen(true);
  };

  // global close handlers
  React.useEffect(() => {
    if (!ctxOpen) return;
    const close = () => setCtxOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("click", close, { capture: true });
    window.addEventListener("contextmenu", close, { capture: true }); // right-click elsewhere
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close, { capture: true } as any);
      window.removeEventListener("contextmenu", close, { capture: true } as any);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [ctxOpen]);

  // optional: actions used by the menu (wrap your existing funcs)
  const handleOpen = () => {
    if (!ctxTarget) return;
    if (ctxTarget.type === "file") onSelectFile(ctxTarget.name);
    else toggleFolder(ctxTarget.name);
    setCtxOpen(false);
  };

  const handleRename = () => {
    if (!ctxTarget) return;
    renameItem(ctxTarget.name);
    setCtxOpen(false);
  };

  const handleDelete = () => {
    if (!ctxTarget) return;
    deleteItem(ctxTarget.name);
    setCtxOpen(false);
  };


  const renderTree = (items: FileItem[], depth = 0) =>
    items.map((item, i) => (
      <div key={i}>
        {item.type === "folder" ? (
          <>
            {/* 1. Folder Row Container */}
            <div
              className="group relative flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm select-none"
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
              onClick={() => setFocusedItem(item.name)}
              onDoubleClick={() => toggleFolder(item.name)}
              onContextMenu={(e) => openContextMenu(e, { name: item.name, type: "folder" })}

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

            </div>

            {/* 5. Recursive Call (Rendering Children) */}
            {expandedFolders[item.name] && item.children && renderTree(item.children, depth + 1)}
          </>
        ) : (
          <div
            className={`group relative flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm select-none ${selectedFile === item.name ? "bg-blue-50 border-l-2 border-blue-500" : ""
              } ${focusedItem === item.name ? "bg-gray-200" : ""}`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={() => setFocusedItem(item.name)}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFocusedItem(null);
              onSelectFile(item.name);
            }}
            onContextMenu={(e) => openContextMenu(e, { name: item.name, type: "file" })}
          >
            <div className="flex items-center gap-2 flex-1 pointer-events-none">
              <FileCode className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{item.name}</span>
            </div>
            {/* Floating Context Menu */}
            {ctxOpen && ctxTarget && (
              <div
                role="menu"
                aria-label="File actions"
                className="fixed z-50 min-w-[200px] rounded-md border border-gray-200 bg-white shadow-xl divide-y divide-gray-100"
                style={{ left: ctxPos.x, top: ctxPos.y }}
                onClick={(e) => e.stopPropagation()} // don't bubble to window click closer
              >
                <div className="py-1">

                  <button
                    role="menuitem"
                    className="w-full px-3 py-2 hover:bg-gray-100 flex items-center gap-3 justify-start text-left"
                    onClick={handleRename}
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                    <span>Rename</span>
                  </button>
                </div>
                <div className="py-1">
                  <button
                    role="menuitem"
                    className="w-full px-3 py-2 hover:bg-gray-100 flex items-center gap-3 justify-start text-left"
                    onClick={handleRename}
                  >
                    <Trash2 className="w-4 h-4 text-gray-600" />
                    <span>Delete</span>
                  </button>
                </div>
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
