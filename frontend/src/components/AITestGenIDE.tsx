import React, { useState, useRef } from "react";
import {
  FileCode,
  FolderClosed,
  FolderOpen,
  Play,
  Settings,
  Files,
  Copy,
  RefreshCw,
  Plus,
} from "lucide-react";
import Editor, { OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";

// Types
interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface Selection {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

const AITestGenIDE: React.FC = () => {
  // ─────────── State ───────────
  const [selectedFile, setSelectedFile] = useState("main.py");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    tests: false,
  });
  const [editorSelection, setEditorSelection] = useState<Selection | null>(null);
  const [showGenerateButton, setShowGenerateButton] = useState(false);

  // ─────────── Refs ───────────
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  // ─────────── File Tree ───────────
  const files: FileNode[] = [
    {
      name: "src",
      type: "folder",
      children: [
        { name: "main.py", type: "file" },
        { name: "utils.py", type: "file" },
        { name: "config.py", type: "file" },
      ],
    },
    {
      name: "tests",
      type: "folder",
      children: [
        { name: "test_main.py", type: "file" },
        { name: "test_utils.py", type: "file" },
      ],
    },
    { name: "README.md", type: "file" },
  ];

  // ─────────── Handlers ───────────
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      const hasSelection = !selection.isEmpty();

      if (hasSelection) {
        setEditorSelection({
          startLine: selection.startLineNumber,
          endLine: selection.endLineNumber,
          startColumn: selection.startColumn,
          endColumn: selection.endColumn,
        });
        setShowGenerateButton(true);
      } else {
        setShowGenerateButton(false);
      }
    });
  };

  const handleGenerateTest = () => {
    setIsGenerating(true);
    // Replace this setTimeout with real API call later
    setTimeout(() => {
      setIsGenerating(false);
      setShowTestPanel(true);
    }, 1500);
  };

  const handleCopyTest = () => {
    if (editorRef.current) {
      const text = editorRef.current.getValue();
      navigator.clipboard.writeText(text);
    }
  };

  const handleInsertTest = () => {
    setSelectedFile("test_main.py");
    setShowTestPanel(false);
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const renderFileTree = (items: FileNode[], depth = 0): JSX.Element[] => {
    return items.map((item, idx) => (
      <div key={idx}>
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
            {expandedFolders[item.name] && item.children && renderFileTree(item.children, depth + 1)}
          </>
        ) : (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm ${
              selectedFile === item.name ? "bg-blue-50 border-l-2 border-blue-500" : ""
            }`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={() => setSelectedFile(item.name)}
          >
            <FileCode className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{item.name}</span>
          </div>
        )}
      </div>
    ));
  };

  // ─────────── UI ───────────
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">AI TestGen</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
              <Files className="w-4 h-4" />
              Files
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
              <Play className="w-4 h-4" />
              Run
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Explorer
            </div>
            {renderFileTree(files)}
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-2 gap-1">
            {["main.py", "test_main.py"].map((file) => (
              <div
                key={file}
                className={`px-4 py-1.5 text-sm rounded-t cursor-pointer ${
                  selectedFile === file
                    ? "bg-white border-t-2 border-blue-500 text-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedFile(file)}
              >
                {file}
              </div>
            ))}
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden flex relative">
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="python"
                value=""
                theme="vs"
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 16, bottom: 16 },
                  lineHeight: 24,
                  renderLineHighlight: "all",
                  selectionHighlight: true,
                  bracketPairColorization: { enabled: true },
                }}
              />

              {/* Generate Test Button */}
              {showGenerateButton && selectedFile === "main.py" && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={handleGenerateTest}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <span className="text-lg">✨</span>
                        Generate Test
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* AI Generated Test Panel */}
            {showTestPanel && (
              <div className="w-1/2 border-l border-gray-200 flex flex-col bg-white">
                <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
                  <h3 className="text-sm font-semibold text-gray-800">Generated Tests</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyTest}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={handleInsertTest}
                      className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insert Test
                    </button>
                    <button
                      onClick={handleGenerateTest}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    value=""
                    theme="vs"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      readOnly: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      padding: { top: 16, bottom: 16 },
                      lineHeight: 24,
                      renderLineHighlight: "all",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestGenIDE;
