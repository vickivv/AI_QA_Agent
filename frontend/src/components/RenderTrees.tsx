"use client";
import React, { useState } from "react";
import { FolderOpen, FolderClosed, FileCode } from "lucide-react";
import { TreeItem } from "./RenderTreesTypes";

interface FileTreeProps {
  items: TreeItem[];
  selectedFile: string;
  expandedByPath: Record<string, boolean>;
  searchHits: string[];

  onSelectFile: (path: string) => void;
  onSelectFolder: (path: string) => void;
  toggleFolder: (path: string) => void;

  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;

  onDeleteFolder: (path: string) => void;
  onRenameFolder: (oldPath: string, newPath: string) => void;
  onDownloadFile: (path: string) => void;
  onMoveFile: (oldPath: string, newFolder: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({
  items,
  selectedFile,
  expandedByPath,
  searchHits,
  onSelectFile,
  onSelectFolder,
  toggleFolder,
  onDeleteFile,
  onRenameFile,
  onDeleteFolder,
  onRenameFolder,
  onDownloadFile,
  onMoveFile,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    path: string;
    type: "file" | "folder";
  } | null>(null);

  const isSearchActive = searchHits.length > 0;

  const renderTree = (nodes: TreeItem[], depth = 0) => {
    return nodes.map((node) => {
      const isFile = node.type === "file";
      const isFolder = node.type === "folder";
      const isExpanded = expandedByPath[node.path];
      const isHit = searchHits.includes(node.path);

      return (
        <div key={node.path}>
          {/* Folder */}
          {isFolder && (
            <>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm hover:bg-gray-100
                    ${isHit ? "bg-yellow-50 font-semibold" : ""}
                `}
                style={{ paddingLeft: depth * 14 }}
                
                // ⭐ 让此 folder 能成为 drop 区域
                onDragOver={(e) => e.preventDefault()}

                // ⭐ 文件被丢到 folder 时触发
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedPath = e.dataTransfer.getData("text/plain");

                  console.log("📂 Dropped file:", draggedPath, "→ Folder:", node.path);

                  // 阻止 folder 自己丢给自己
                  if (draggedPath === node.path) return;

                  // 必须实现：FileTree props 加 onMoveFile
                  onMoveFile(draggedPath, node.path);

                  setContextMenu(null);
                }}

                onClick={() => {
                  toggleFolder(node.path);
                  onSelectFolder(node.path);
                  setContextMenu(null);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    path: node.path,
                    type: "folder",
                  });
                }}
              >
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <FolderClosed className="w-4 h-4 text-blue-500" />
                )}
                {node.name}
              </div>

              {isExpanded && node.children && (
                <div>{renderTree(node.children, depth + 1)}</div>
              )}
            </>
          )}

          {/* File */}
          {isFile && (
            <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", node.path);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm hover:bg-gray-100
                    ${selectedFile === node.path ? "bg-blue-50 border-l-2 border-blue-500" : ""}
                    ${isHit ? "bg-yellow-50 font-semibold" : ""}
                `}
                style={{ paddingLeft: depth * 14 }}

              onClick={() => {
                onSelectFile(node.path);
                setContextMenu(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  path: node.path,
                  type: "file",
                });
              }}
            >
              <FileCode className="w-4 h-4 text-gray-500" />
              {node.name}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {renderTree(items)}

      {/* Right-click context menu */}
      {contextMenu?.visible && (
        <div
          className="fixed bg-white shadow-lg border rounded text-sm z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {/* Rename */}
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              const newName = prompt(
                "Rename to:",
                contextMenu.path.split("/").pop()
              );
              if (!newName) return;

              const base = contextMenu.path.split("/").slice(0, -1).join("/");
              const newPath = base ? `${base}/${newName}` : newName;

              if (contextMenu.type === "file") {
                onRenameFile(contextMenu.path, newPath);
              } else {
                onRenameFolder(contextMenu.path, newPath);
              }

              setContextMenu(null);
            }}
          >
            Rename
          </div>

          {/* Delete */}
          <div
            className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              if (!confirm(`Delete ${contextMenu.path}?`)) return;

              if (contextMenu.type === "file") {
                onDeleteFile(contextMenu.path);
              } else {
                onDeleteFolder(contextMenu.path);
              }

              setContextMenu(null);
            }}
          >
            Delete
          </div>
          <div
            className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              onDownloadFile(contextMenu.path);
              setContextMenu(null);
            }}
          >
            Download
          </div>
        </div>
      )}
    </>
  );
};

export default FileTree;
