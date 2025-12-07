// utils/buildTree.ts
import { FileRecord } from "../components/fileReducer";
import { FolderRecord } from "../components/folderReducer";
import { FileNode, FolderNode, TreeItem } from "../features/fileSystem/RenderTreesTypes";

export default function buildTree(
  files: FileRecord[],
  folders: FolderRecord[]
): TreeItem[] {
  const folderMap: Record<string, FolderNode> = {};

  // Create a map of folder path to FolderNode
  folders.forEach((f) => {
    folderMap[f.path] = {
      path: f.path,
      name: f.name,
      type: "folder",
      children: [],
    };
  });

  // Add child folders to parent folder
  folders.forEach((f) => {
    const seg = f.path.split("/");
    if (seg.length > 1) {
      const parent = seg.slice(0, -1).join("/");
      if (folderMap[parent]) {
        folderMap[parent].children.push(folderMap[f.path]);
      }
    }
  });

  // Add files to corresponding folder
  files.forEach((file) => {
    const seg = file.path.split("/");
    const parent = seg.slice(0, -1).join("/");
    if (folderMap[parent]) {
      folderMap[parent].children.push({
        path: file.path,
        name: file.name,
        type: "file",
      });
    }
  });

  // root-level folders（src / tests）
  return folders
    .filter((f) => !f.path.includes("/"))
    .map((r) => folderMap[r.path]);
}
