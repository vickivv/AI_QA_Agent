"use client";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addFile, deleteFile, renameFile } from "./fileReducer"
import { addNewFolder, deleteFolder, updateFolderName } from "./folderReducer"
import { FileCode, FolderOpen, FolderClosed, Plus } from "lucide-react";
import FileTree from "./RenderTrees"
import { TreeItem } from "./RenderTrees"
import { RootState } from "../store/index";
import { toggleFolder } from "../store/explorerSlice";

export interface FileExplorerProps {
  files: TreeItem[];
  selectedFile: string;
  onSelectFile: (name: string) => void;
  //onUpdateFiles: (files: FileItem[]) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
  //onUpdateFiles,
}) => {
  const dispatch = useDispatch();
  const { expandedByPath, searchHits } = useSelector((state: RootState) => state.explorer);

  //// You no longer need to define toggleFolder here, as that logic should be in Redux now
  // and dispatched from the FileTree component. However, since your existing code
  // seems to rely on local state, I'll update it to use the Redux dispatch.
  // The toggle logic should ideally dispatch an action from the FileTree component itself
  // to update the Redux state (expandedByPath).
  // const toggleFolder = (folderName: string) => {
  //   setExpandedFolders((prev) => ({
  //     ...prev,
  //     [folderName]: !prev[folderName],
  //   }));
  // };


  // const addNewFile = () => {
  //   const name = prompt("Enter new file name (e.g., script.py):");
  //   if (!name) return;
  //   onUpdateFiles([...files, { name, type: "file" }]);
  // };
  const handleAddNewFile = () => {
    const name = prompt("Enter new file name (e.g., script.py):");
    if (!name) return;
    dispatch(addFile({ name: name, content: '', _id: null }));
  };

  // const addNewFolder = () => {
  //   const name = prompt("Enter new folder name:");
  //   if (!name) return;
  //   onUpdateFiles([...files, { name, type: "folder", children: [] }]);
  // };
  const handleAddNewFolder = () => {
    const name = prompt("Enter new folder name:");
    if (!name) return;
    dispatch(addNewFolder({ name: name }));
  };


  // const renderTree = (items: FileItem[], depth = 0) =>
  //   items.map((item, i) => (
  //     <div key={i}>
  //       {item.type === "folder" ? (
  //         <>
  //           <div
  //           className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
  //           style={{ paddingLeft: `${depth * 12 + 12}px` }}
  //           onClick={() => toggleFolder(item.name)}
  //         >
  //           {expandedFolders[item.name] ? (
  //             <FolderOpen className="w-4 h-4 text-blue-500" />
  //           ) : (
  //             <FolderClosed className="w-4 h-4 text-blue-500" />
  //           )}
  //           <span className="text-gray-700">{item.name}</span>
  //         </div>
  //         {expandedFolders[item.name] && item.children && renderTree(item.children, depth + 1)}
  //       </>
  //     ) : (
  //       <div
  //         className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm ${selectedFile === item.name ? "bg-blue-50 border-l-2 border-blue-500" : ""
  //           }`}
  //         style={{ paddingLeft: `${depth * 12 + 12}px` }}
  //         onClick={() => onSelectFile(item.name)}
  //       >
  //         <FileCode className="w-4 h-4 text-gray-500" />
  //         <span className="text-gray-700">{item.name}</span>
  //       </div>
  //     )}
  //   </div>
  // ));

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Explorer</h3>
        <div className="flex gap-1">
          <button
            title="Add file"
            onClick={handleAddNewFile}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            title="Add folder"
            onClick={handleAddNewFolder}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <FolderClosed className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      {/*<div className="flex-1 overflow-y-auto">{renderTree(files)}</div>*/}
      <div className="flex-1 overflow-y-auto">
        <FileTree
          items={files} // Redux state
          selectedFile={selectedFile}
          expandedByPath={expandedByPath}  // Pass search hits for filtering/highlighting    
          searchHits={searchHits}
          onSelectFile={onSelectFile}
          toggleFolder={(path: string) => dispatch(toggleFolder(path))}
        />
        {/* <FileTree
          items={files}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          toggleFolder={toggleFolder}
          onSelectFile={onSelectFile} /> */}
      </div>
    </div>
  );
};

export default FileExplorer;
