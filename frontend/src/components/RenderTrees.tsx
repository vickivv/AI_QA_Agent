import React from 'react';
import { FolderOpen, FolderClosed, FileCode } from 'lucide-react';
// import { Provider } from "react-redux";
// import store from "../store"

const join = (base: string, name: string) => (base ? `${base}/${name}` : name);
export interface FileItem {
    _id: string;
    name: string;
    type: 'file';
    folderId?: string;
}

export interface FolderItem {
    _id: string;
    name: string;
    type: 'folder';
    children?: TreeItem[];
}

// 2. UNION TYPE: The array passed to the component will be a mix of these
export type TreeItem = FileItem | FolderItem;

// --- 3. PROPS INTERFACE ---
interface FileTreeProps {
    items: TreeItem[]; // The root list of files/folders
    selectedFile: string;
    expandedByPath: Record<string, boolean>;
    searchHits: string[];
    // expandedFolders: { [key: string]: boolean };
    onSelectFile: (path: string) => void;
    toggleFolder: (path: string) => void;
}

// --- Component Implementation ---
const FileTree: React.FC<FileTreeProps> = ({
    items,
    selectedFile,
    expandedByPath,
    searchHits,
    onSelectFile,
    toggleFolder
}) => {
    const isSearchActive = searchHits.length > 0; // Check if search is active

    const renderTree = (currentItems: TreeItem[], depth = 0, basePath = "") => {
        // We use map to process the current items
        return currentItems.map((item, i) => {
            const itemPath = join(basePath, item.name);
            const isHit = searchHits.includes(itemPath);

            // 1. Determine Visibility
            // If search is active, the item must be a direct hit or an ancestor of a hit
            let isVisible = true;
            if (isSearchActive) {
                // An item is visible if it is a hit, or if it is a folder and one of its children is a hit.
                // We check if its path is included in searchHits (which covers both files and expanded folders)
                // Since expandedByPath is updated by the search thunk for all ancestors,
                // we can rely on a simpler check for visibility.

                // For a file, it must be a direct hit.
                if (item.type === 'file') {
                    isVisible = isHit;
                } else if (item.type === 'folder') {
                    // For a folder, it must be a direct hit (meaning it matches the query) OR 
                    // an ancestor (which we check by seeing if any hit path starts with this folder's path).
                    const isAncestor = searchHits.some(hitPath =>
                        hitPath.startsWith(itemPath + '/')
                    );
                    isVisible = isHit || isAncestor;
                }
            }

            if (!isVisible) {
                return null;
            }

            // 2. Render Visible Item
            return (
                <div key={itemPath}>
                    {item.type === "folder" ? (
                        <>
                            {/* Folder Display */}
                            <div
                                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm hover:bg-gray-100 ${isHit ? 'bg-yellow-50 font-semibold' : ''}`}
                                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                                // CRITICAL FIX: Use the full path for the Redux action
                                onClick={() => toggleFolder(itemPath)}
                            >
                                {expandedByPath[itemPath] ? (
                                    <FolderOpen className="w-4 h-4 text-blue-500" />
                                ) : (
                                    <FolderClosed className="w-4 h-4 text-blue-500" />
                                )}
                                <span className="text-gray-700">{item.name}</span>
                            </div>

                            {/* Recursively Render Children if Expanded (Use Redux state) */}
                            {expandedByPath[itemPath] && item.children && item.children.length > 0 && (
                                renderTree(item.children, depth + 1, itemPath)
                            )}
                        </>
                    ) : (
                        /* File Display */
                        <div
                            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm ${selectedFile === itemPath ? "bg-blue-50 border-l-2 border-blue-500" : ""} ${isHit ? 'bg-yellow-50 font-semibold' : ''}`}
                            style={{ paddingLeft: `${depth * 12 + 12}px` }}
                            onClick={() => onSelectFile(itemPath)}
                        >
                            <FileCode className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{item.name}</span>
                        </div>
                    )}
                </div>
            );
        });
    };

    // --- Component Render ---
    return (
        <div className="file-tree-container">
            {renderTree(items, 0, "")}
        </div>
    );
};

export default FileTree;
