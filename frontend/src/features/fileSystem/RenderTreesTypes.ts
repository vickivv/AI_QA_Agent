export interface FileNode {
  path: string;
  name: string;
  type: "file";
}

export interface FolderNode {
  path: string;
  name: string;
  type: "folder";
  children: TreeItem[]; 
}

export type TreeItem = FileNode | FolderNode;

