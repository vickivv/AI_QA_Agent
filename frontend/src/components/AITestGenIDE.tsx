import { Provider } from "react-redux";
import { store } from "../store"; // adjust the path
import SearchBar from "../components/SearchBar";
import React, { useState, useRef, useEffect } from "react";
import { Files, Play, Settings, RefreshCw, Search } from "lucide-react";
import Editor, { OnMount } from "@monaco-editor/react";
import { loadPyodide, PyodideInterface } from "pyodide";
import * as monaco from "monaco-editor";
import FileExplorer, { FileItem } from "./FileExplorer";

const AITestGenIDE: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>("main.py");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [showSearch, setShowSearch] = React.useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    "main.py": "",
    "test_main.py": "",
  });

  const [files, setFiles] = useState<FileItem[]>([
    { name: "src", type: "folder", children: [{ name: "main.py", type: "file" }] },
    { name: "tests", type: "folder", children: [{ name: "test_main.py", type: "file" }] },
  ]);

  // --- Pyodide setup ---
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  useEffect(() => {
    const init = async () => {
      const py = await loadPyodide();
      setPyodide(py);
    };
    init();
  }, []);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value?: string) => {
    setFileContents((prev) => ({
      ...prev,
      [selectedFile]: value ?? "",
    }));
  };

  const handleGenerateTest = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setSelectedFile("test_main.py"); // simulate generation by switching tab
    }, 1000);
  };

  const handleRunCode = async () => {
    if (!pyodide) {
      setOutput("⏳ Initializing Python runtime...");
      return;
    }

    const code = fileContents[selectedFile];
    if (!code.trim()) {
      setOutput("⚠️ No code to run.");
      return;
    }

    try {
      // capture stdout
      let result = "";
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = sys.stdout
      `);
      await pyodide.runPythonAsync(code);
      result = pyodide.runPython("sys.stdout.getvalue()");
      setOutput(result || "✅ Executed successfully (no output)");
    } catch (err: any) {
      setOutput(`❌ Error: ${err.message}`);
    }
  };




  return (
    <Provider store={store}>
      <div className="h-screen flex flex-col bg-white">
        {/* --- Top bar --- */}
        <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">AI TestGen</h1>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
                <Files className="w-4 h-4" /> Files
              </button>
              <button
                onClick={handleRunCode}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" /> Run
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button
                onClick={() => setShowSearch((s) => !s)}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" /> Search
              </button>

              {/* show the bar when toggled */}
              {showSearch && <SearchBar files={files} />}
            </div>
          </div>
        </div>

        {/* --- Main area (Explorer + Editor + Tabs) --- */}
        <div className="flex-1 flex overflow-hidden">
          {/* --- File Explorer sidebar --- */}
          <FileExplorer
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onUpdateFiles={setFiles}
          />

          {/* --- Editor wrapper (Tabs + Editor) --- */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* --- Tabs --- */}
            <div className="h-9 bg-white border-b border-gray-200 flex items-center px-2 gap-1">
              {Object.keys(fileContents).map((file) => (
                <div
                  key={file}
                  className={`px-4 py-1.5 text-sm rounded-t cursor-pointer ${selectedFile === file
                    ? "bg-white border-t-2 border-blue-500 text-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                  onClick={() => setSelectedFile(file)}
                >
                  {file}
                </div>
              ))}
            </div>

            {/* --- Editor --- */}
            <div className="flex-1 relative">
              <Editor
                key={selectedFile}
                height="100%"
                defaultLanguage="python"
                value={fileContents[selectedFile] ?? ""}
                theme="vs"
                onMount={handleEditorDidMount}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
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

              {/* --- Generate Test Button --- */}
              {selectedFile === "main.py" && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={handleGenerateTest}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <span className="text-lg">✨</span> Generate Test
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Output Console --- */}
        {output && (
          <div className="border-t border-gray-200 bg-gray-50 text-sm text-gray-800 font-mono px-4 py-3 overflow-auto h-32">
            {output}
          </div>
        )}
      </div>
    </Provider>
  );
};

export default AITestGenIDE;
