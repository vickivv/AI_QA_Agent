"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./index";

import { addFile, deleteFile, renameFile, updateFilePathsAfterFolderRename } from "./fileReducer";
import { addNewFolder, deleteFolder, renameFolder } from "./folderReducer";
import { toggleFolder, setSelectedFolder } from "./explorerSlice";

import buildTree from "./buildTree";
import FileTree from "./RenderTrees";
import { FilePlus, FolderPlus } from "lucide-react";

interface FileExplorerProps {
  selectedFile: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onFolderRename: (oldPath: string, newPath: string) => void;
  onDownloadFile: (path: string) => void;
  onMoveFile: (oldPath: string, newFolder: string) => void;
  onFileRename: (oldPath: string, newPath: string) => void;
}

export default function FileExplorer({
  selectedFile,
  onSelectFile,
  onCreateFile,
  onFolderRename,
  onDownloadFile,
  onMoveFile,
  onFileRename
}: FileExplorerProps) {
  const dispatch = useDispatch();

  const files = useSelector((s: RootState) => s.file.files);
  const folders = useSelector((s: RootState) => s.folderReducer.folders);
  const tree = buildTree(files, folders);

  const { expandedByPath, searchHits, selectedFolder } = useSelector(
    (s: RootState) => s.explorer
  );

  // Add File 
  const handleAddFile = () => {
    const name = prompt("File name:");
    if (!name) return;

    const base = selectedFolder; // "" means root
    const fullPath = base ? `${base}/${name}` : name;

    dispatch(addFile({ path: fullPath }));
    onCreateFile(fullPath);
    onSelectFile(fullPath);
  };

  // Add Folder 
  const handleAddFolder = () => {
    const name = prompt("Folder name:");
    if (!name) return;

    const base = selectedFolder; // "" = workspace root
    const fullPath = base ? `${base}/${name}` : name;

    dispatch(addNewFolder({ path: fullPath }));
    dispatch(toggleFolder(fullPath));
    dispatch(setSelectedFolder(fullPath));
  };

  // Move File
  const handleMoveFile = (oldPath: string, folderPath: string) => {
  const fileName = oldPath.split("/").pop();
  const newPath = `${folderPath}/${fileName}`;

  dispatch(renameFile({ oldPath, newPath }));
  onFolderRename(oldPath, newPath); // update openTabs + fileContents
};

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Explorer
        </h3>

        <div className="flex gap-1">
          <button onClick={handleAddFile} className="p-1 hover:bg-gray-100 rounded">
            <FilePlus className="w-4 h-4 text-gray-600" />
          </button>

          <button onClick={handleAddFolder} className="p-1 hover:bg-gray-100 rounded">
            <FolderPlus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Workspace Root */}
      <div
        className={`px-3 py-1.5 cursor-pointer text-sm hover:bg-gray-100 ${
          selectedFolder === "" ? "bg-blue-50 font-semibold" : ""
        }`}
        onClick={() => dispatch(setSelectedFolder(""))}
      >
        Workspace
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        <FileTree
          items={tree}
          selectedFile={selectedFile}
          expandedByPath={expandedByPath}
          searchHits={searchHits}
          onSelectFile={onSelectFile}
          toggleFolder={(p) => dispatch(toggleFolder(p))}
          onDeleteFile={(p) => dispatch(deleteFile({ path: p }))}
          onRenameFile={(oldPath, newPath) => {
            // update redux store
            dispatch(renameFile({ oldPath, newPath }));
            // IDE → update fileContents + tabs + activeTab
            onFileRename(oldPath, newPath);
          }}
          onDeleteFolder={(p) => dispatch(deleteFolder({ path: p }))}
          onRenameFolder={(o, n) => {
            dispatch(renameFolder({ oldPath: o, newPath: n }));
            dispatch(updateFilePathsAfterFolderRename({ oldPath: o, newPath: n }));
            onFolderRename(o, n);   
          }}
          onSelectFolder={(p) => dispatch(setSelectedFolder(p))}
          onDownloadFile={onDownloadFile} 
          onMoveFile={handleMoveFile}
        />
      </div>
    </div>
  );
}
